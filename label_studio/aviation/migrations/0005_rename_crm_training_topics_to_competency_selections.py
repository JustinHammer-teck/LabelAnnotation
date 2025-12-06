# Generated manually
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("aviation", "0004_change_crm_topics_to_dict"),
    ]

    operations = [
        migrations.RenameField(
            model_name="aviationannotation",
            old_name="crm_training_topics",
            new_name="competency_selections",
        ),
    ]
