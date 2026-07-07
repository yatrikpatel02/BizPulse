from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


def get_or_create_social_user(
    provider,
    social_id,
    email,
    first_name='',
    last_name='',
    avatar='',
):
    """Return (user, created) for a social login.

    If a user already exists for this social account it is returned.
    If the email already belongs to a local account, that account is linked
    to the social provider (so the user keeps their existing profile).
    Otherwise a new account is created (this is the "sign up" path).
    """
    email = (email or '').strip().lower()

    existing = User.objects.filter(auth_provider=provider, social_uid=social_id).first()
    if existing:
        return existing, False

    if email:
        by_email = User.objects.filter(email__iexact=email).first()
        if by_email:
            by_email.auth_provider = provider
            by_email.social_uid = social_id
            if avatar and not by_email.avatar:
                by_email.avatar = avatar
            by_email.save(update_fields=['auth_provider', 'social_uid', 'avatar'])
            return by_email, False

    if not email:
        raise ValueError(
            'This social account did not provide an email address. '
            'Please use an account with a verified email.'
        )

    username = _generate_username(email)
    with transaction.atomic():
        user = User(
            username=username,
            email=email,
            first_name=first_name or '',
            last_name=last_name or '',
            auth_provider=provider,
            social_uid=social_id,
            avatar=avatar or None,
        )
        user.set_unusable_password()
        user.save()
    return user, True


def _generate_username(email):
    base = email.split('@')[0] or 'user'
    base = ''.join(c for c in base if c.isalnum() or c in '_-') or 'user'
    username = base
    i = 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{i}'
        i += 1
    return username
