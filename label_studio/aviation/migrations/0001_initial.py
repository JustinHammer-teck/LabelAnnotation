from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '__latest__'),
        ('tasks', '__latest__'),
        ('data_import', '__latest__'),
    ]

    operations = [
        migrations.CreateModel(
            name='AviationProject',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('threat_mapping', models.JSONField(default=dict, help_text='Threat type to training topic mappings')),
                ('error_mapping', models.JSONField(default=dict, help_text='Error type to training topic mappings')),
                ('uas_mapping', models.JSONField(default=dict, help_text='UAS type to training topic mappings')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('project', models.OneToOneField(db_index=True, help_text='Associated Label Studio project', on_delete=django.db.models.deletion.CASCADE, related_name='aviation_project', to='projects.project')),
            ],
            options={
                'db_table': 'aviation_project',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='AviationIncident',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_number', models.CharField(db_index=True, help_text='Unique event identifier', max_length=50)),
                ('event_description', models.TextField(help_text='Full description of the aviation incident')),
                ('date', models.DateField(db_index=True, help_text='Date when incident occurred')),
                ('time', models.TimeField(blank=True, help_text='Time when incident occurred', null=True)),
                ('location', models.CharField(blank=True, help_text='Location where incident occurred', max_length=200)),
                ('airport', models.CharField(blank=True, db_index=True, help_text='Airport code or name', max_length=100)),
                ('flight_phase', models.CharField(blank=True, help_text='Phase of flight when incident occurred', max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('source_file', models.ForeignKey(help_text='Source Excel file for this incident', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='aviation_incidents', to='data_import.fileupload')),
                ('task', models.OneToOneField(db_index=True, help_text='Associated task for this incident', on_delete=django.db.models.deletion.CASCADE, related_name='aviation_incident', to='tasks.task')),
            ],
            options={
                'db_table': 'aviation_incident',
                'ordering': ['-date', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='AviationDropdownOption',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(db_index=True, help_text='Category: aircraft, threat, error, etc.', max_length=50)),
                ('level', models.IntegerField(db_index=True, default=1, help_text='Hierarchy level (1, 2, or 3)')),
                ('code', models.CharField(db_index=True, help_text='Option code or abbreviation', max_length=50)),
                ('label', models.CharField(help_text='Display label for option', max_length=200)),
                ('training_topics', models.JSONField(blank=True, default=list, help_text='Associated training topics for auto-calculation', null=True)),
                ('display_order', models.IntegerField(default=0, help_text='Display order within parent/level')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Whether this option is currently active')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('parent', models.ForeignKey(blank=True, help_text='Parent option for hierarchical structure', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='aviation.aviationdropdownoption')),
            ],
            options={
                'db_table': 'aviation_dropdown_option',
                'ordering': ['category', 'level', 'display_order'],
                'unique_together': {('category', 'level', 'code')},
            },
        ),
        migrations.CreateModel(
            name='AviationAnnotation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('aircraft_type', models.CharField(blank=True, help_text='Type of aircraft involved', max_length=100)),
                ('event_labels', models.JSONField(default=list, help_text='Array of selected event labels')),
                ('threat_type_l1', models.CharField(blank=True, db_index=True, help_text='Threat type level 1 category', max_length=100)),
                ('threat_type_l2', models.CharField(blank=True, help_text='Threat type level 2 category', max_length=100)),
                ('threat_type_l3', models.CharField(blank=True, help_text='Threat type level 3 category', max_length=200)),
                ('threat_management', models.CharField(blank=True, help_text='How threat was managed', max_length=50)),
                ('threat_outcome', models.CharField(blank=True, help_text='Outcome of threat', max_length=50)),
                ('threat_description', models.TextField(blank=True, help_text='Detailed threat description')),
                ('error_relevancy', models.CharField(blank=True, help_text='Relevancy of error', max_length=50)),
                ('error_type_l1', models.CharField(blank=True, db_index=True, help_text='Error type level 1 category', max_length=100)),
                ('error_type_l2', models.CharField(blank=True, help_text='Error type level 2 category', max_length=100)),
                ('error_type_l3', models.CharField(blank=True, help_text='Error type level 3 category', max_length=200)),
                ('error_management', models.CharField(blank=True, help_text='How error was managed', max_length=50)),
                ('error_outcome', models.CharField(blank=True, help_text='Outcome of error', max_length=50)),
                ('error_description', models.TextField(blank=True, help_text='Detailed error description')),
                ('uas_relevancy', models.CharField(blank=True, help_text='Relevancy of UAS', max_length=50)),
                ('uas_type_l1', models.CharField(blank=True, db_index=True, help_text='UAS type level 1 category', max_length=100)),
                ('uas_type_l2', models.CharField(blank=True, help_text='UAS type level 2 category', max_length=100)),
                ('uas_type_l3', models.CharField(blank=True, help_text='UAS type level 3 category', max_length=200)),
                ('uas_management', models.CharField(blank=True, help_text='How UAS was managed', max_length=50)),
                ('uas_description', models.TextField(blank=True, help_text='Detailed UAS description')),
                ('competency_indicators', models.JSONField(default=list, help_text='Array of selected competency indicators')),
                ('likelihood', models.CharField(blank=True, help_text='Likelihood assessment', max_length=50)),
                ('severity', models.CharField(blank=True, help_text='Severity assessment', max_length=50)),
                ('training_benefit', models.CharField(blank=True, help_text='Potential training benefit', max_length=50)),
                ('crm_training_topics', models.JSONField(default=list, help_text='Array of CRM training topics')),
                ('threat_training_topics', models.JSONField(default=list, help_text='Auto-calculated training topics based on threat selection')),
                ('error_training_topics', models.JSONField(default=list, help_text='Auto-calculated training topics based on error selection')),
                ('uas_training_topics', models.JSONField(default=list, help_text='Auto-calculated training topics based on UAS selection')),
                ('training_plan_ideas', models.TextField(blank=True, help_text='Ideas for training plan')),
                ('goals_to_achieve', models.TextField(blank=True, help_text='Goals to achieve with training')),
                ('notes', models.TextField(blank=True, help_text='Additional notes')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('annotation', models.OneToOneField(db_index=True, help_text='Associated annotation', on_delete=django.db.models.deletion.CASCADE, related_name='aviation_annotation', to='tasks.annotation')),
            ],
            options={
                'db_table': 'aviation_annotation',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='aviationproject',
            index=models.Index(fields=['project'], name='aviation_pr_project_idx'),
        ),
        migrations.AddIndex(
            model_name='aviationincident',
            index=models.Index(fields=['task'], name='aviation_in_task_id_idx'),
        ),
        migrations.AddIndex(
            model_name='aviationincident',
            index=models.Index(fields=['event_number'], name='aviation_in_event_n_idx'),
        ),
        migrations.AddIndex(
            model_name='aviationincident',
            index=models.Index(fields=['date', 'airport'], name='aviation_in_date_idx'),
        ),
        migrations.AddIndex(
            model_name='aviationdropdownoption',
            index=models.Index(fields=['category', 'level'], name='aviation_dr_categor_idx'),
        ),
        migrations.AddIndex(
            model_name='aviationdropdownoption',
            index=models.Index(fields=['parent', 'display_order'], name='aviation_dr_parent__idx'),
        ),
        migrations.AddIndex(
            model_name='aviationdropdownoption',
            index=models.Index(fields=['category', 'is_active'], name='aviation_dr_categor_active_idx'),
        ),
        migrations.AddIndex(
            model_name='aviationannotation',
            index=models.Index(fields=['annotation'], name='aviation_an_annotat_idx'),
        ),
        migrations.AddIndex(
            model_name='aviationannotation',
            index=models.Index(fields=['threat_type_l1', 'error_type_l1'], name='aviation_an_threat__idx'),
        ),
        migrations.AddIndex(
            model_name='aviationannotation',
            index=models.Index(fields=['aircraft_type'], name='aviation_an_aircraf_idx'),
        ),
    ]
