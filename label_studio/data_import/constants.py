"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from typing import Final

ALLOWED_FILE_EXTENSIONS: Final[frozenset[str]] = frozenset({
    # Images
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.svg',
    # Documents
    '.pdf', '.txt', '.doc', '.docx',
    # Data formats
    '.csv', '.json', '.tsv', '.xml', '.yaml', '.yml',
    # Audio
    '.wav', '.mp3', '.flac', '.ogg', '.m4a',
    # Video
    '.mp4', '.avi', '.mov', '.webm', '.mkv',
    # HTML/Web
    '.html', '.htm',
})

VALID_ORDERINGS: Final[frozenset[str]] = frozenset({
    'created_at', '-created_at', 'id', '-id', 'file', '-file'
})
