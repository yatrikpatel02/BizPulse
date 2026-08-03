import os

from django.conf import settings
from django.test.runner import DiscoverRunner

APPS_DIR = str(settings.BASE_DIR / "apps")


class AppsOnPathTestRunner(DiscoverRunner):
    """Discover tests from the ``apps/`` source directory.

    Project apps live under ``backend/apps/`` and are registered in
    INSTALLED_APPS by their bare package name (``accounts``, ``analytics``,
    ...). The ``apps/`` directory is added to ``sys.path`` (see
    ``manage.py`` and ``settings/base.py``) so each app is importable as a
    top-level package. ``apps`` itself is intentionally **not** a Python
    package.

    Django's default discovery starts from the project root (``backend/``),
    which would walk into ``apps/`` and import every app's models as
    ``apps.<name>.models...``. That module path does not match the app
    config name (``<name>``) and breaks Django's automatic ``app_label``
    detection, raising ``RuntimeError: Model class ... doesn't declare an
    explicit app_label``. Discovering from within ``apps/`` instead keeps
    the import paths aligned with the installed app names.
    """

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("top_level", APPS_DIR)
        super().__init__(*args, **kwargs)

    def build_suite(self, test_labels=None, **kwargs):
        if not test_labels:
            test_labels = [APPS_DIR]
        return super().build_suite(test_labels=test_labels, **kwargs)
