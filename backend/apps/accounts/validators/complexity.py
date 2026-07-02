import re
from django.contrib.auth.password_validation import MinimumLengthValidator
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class ComplexityPasswordValidator:
    """
    Validates that a password meets complexity requirements:
    - At least one uppercase character
    - At least one lowercase character
    - At least one digit
    - At least one special character
    """

    # Same patterns used by frontend checkmarks
    UPPERCASE_RE = re.compile(r'[A-Z]')
    LOWERCASE_RE = re.compile(r'[a-z]')
    DIGIT_RE = re.compile(r'\d')
    SPECIAL_RE = re.compile(r'[^A-Za-z0-9]')

    def validate(self, password, user=None):
        missing = []
        if not self.UPPERCASE_RE.search(password):
            missing.append('at least one uppercase character')
        if not self.LOWERCASE_RE.search(password):
            missing.append('at least one lowercase character')
        if not self.DIGIT_RE.search(password):
            missing.append('at least one number')
        if not self.SPECIAL_RE.search(password):
            missing.append('at least one special character')

        if missing:
            raise ValidationError(
                _('Password must contain %(requirements)s.'),
                code='password_too_simple',
                params={'requirements': ', '.join(missing)},
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least one uppercase letter, "
            "one lowercase letter, one number, and one special character."
        )
