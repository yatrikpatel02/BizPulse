import jwt
from jwt import PyJWKClient
from django.conf import settings

GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com']


def verify_google_id_token(id_token, client_id=None):
    """Verify a Google OAuth2 ID token and return its payload.

    Performs signature verification against Google's rotating public keys,
    plus audience, issuer and expiry validation.
    """
    client_id = client_id or getattr(settings, 'GOOGLE_CLIENT_ID', '')
    if not client_id:
        raise ValueError('GOOGLE_CLIENT_ID is not configured.')

    jwk_client = PyJWKClient(GOOGLE_CERTS_URL, cache_keys=True)
    signing_key = jwk_client.get_signing_key_from_jwt(id_token)

    payload = jwt.decode(
        id_token,
        signing_key.key,
        algorithms=['RS256'],
        audience=client_id,
        issuer=GOOGLE_ISSUERS,
        options={'verify_exp': True},
    )
    return payload
