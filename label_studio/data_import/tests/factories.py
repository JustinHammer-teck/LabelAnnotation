import factory
from core.utils.common import load_func
from django.conf import settings
from django.core.files.base import ContentFile
from data_import.models import FileUpload, PDFImageRelationship


class FileUploadFactory(factory.django.DjangoModelFactory):
    user = factory.SubFactory(load_func(settings.USER_FACTORY))
    project = factory.SubFactory(load_func(settings.PROJECT_FACTORY))
    file = factory.LazyAttribute(
        lambda obj: ContentFile(b'test file content', name='test_file.txt')
    )

    class Meta:
        model = FileUpload

    @classmethod
    def create_with_format(cls, format_ext, **kwargs):
        """Helper to create FileUpload with specific format"""
        kwargs['file'] = ContentFile(b'test content', name=f'test_file{format_ext}')
        return cls.create(**kwargs)


class PDFImageRelationshipFactory(factory.django.DjangoModelFactory):
    pdf_file = factory.SubFactory(
        FileUploadFactory,
        file=factory.LazyAttribute(
            lambda obj: ContentFile(b'fake pdf content', name='test.pdf')
        )
    )
    image_file = factory.SubFactory(
        FileUploadFactory,
        file=factory.LazyAttribute(
            lambda obj: ContentFile(b'fake image content', name='test_page_1.png')
        )
    )
    page_number = factory.Sequence(lambda n: n + 1)
    image_format = 'png'
    resolution_dpi = 300
    extraction_params = factory.Dict({})

    class Meta:
        model = PDFImageRelationship
