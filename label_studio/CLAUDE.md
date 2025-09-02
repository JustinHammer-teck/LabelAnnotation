### DJANGO project Structure

```
.
├── __init__.py
├── annotation_templates
│   ├── CONTRIBUTING.md
│   ├── README.md
│   ├── audio-speech-processing
│   │   ├── automatic-speech-recognition
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── automatic-speech-recognition-using-segments
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── conversational-analysis
│   │   │   └── config.yml
│   │   ├── intent-classification
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── signal-quality-detection
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── sound-event-detection
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── speaker-segmentation
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   └── speech-transcription
│   │       └── config.yml
│   ├── computer-vision
│   │   ├── image-captioning
│   │   │   └── config.yml
│   │   ├── image-classification
│   │   │   └── config.yml
│   │   ├── inventory-tracking
│   │   │   └── config.yml
│   │   ├── keypoints
│   │   │   └── config.yml
│   │   ├── medical-image-classification-with-bboxes
│   │   │   └── config.yml
│   │   ├── multipage-documents
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── object-detection-with-bounding-boxes
│   │   │   └── config.yml
│   │   ├── optical-character-recognition
│   │   │   └── config.yml
│   │   ├── semantic-segmentation-with-masks
│   │   │   └── config.yml
│   │   ├── semantic-segmentation-with-polygons
│   │   │   └── config.yml
│   │   ├── visual-genome
│   │   │   └── config.yml
│   │   └── visual-question-answering
│   │       └── config.yml
│   ├── conversational-ai
│   │   ├── coreference-resolution-and-entity-linking
│   │   │   └── config.yml
│   │   ├── intent-classification-and-slot-filling
│   │   │   └── config.yml
│   │   ├── response-generation
│   │   │   └── config.yml
│   │   └── response-selection
│   │       └── config.yml
│   ├── generative-ai
│   │   ├── chatbot-assessment
│   │   │   └── config.yml
│   │   ├── human-feedback-collection
│   │   │   └── config.yml
│   │   ├── llm-ranker
│   │   │   ├── config.yml
│   │   │   └── example.json
│   │   ├── response-grading
│   │   │   └── config.yml
│   │   ├── supervised-llm
│   │   │   └── config.yml
│   │   └── visual-ranker
│   │       ├── config.yml
│   │       └── example.json
│   ├── groups.txt
│   ├── natural-language-processing
│   │   ├── content-moderation
│   │   │   └── config.yml
│   │   ├── machine-translation
│   │   │   └── config.yml
│   │   ├── named-entity-recognition
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── question-answering
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── relation-extraction
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── taxonomy
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── text-classification
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   └── text-summarization
│   │       ├── config.xml
│   │       └── config.yml
│   ├── ranking-and-scoring
│   │   ├── asr-hypotheses
│   │   │   └── config.yml
│   │   ├── content-based-image-search
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── document-retrieval
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── pairwise-classification
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── pairwise-regression
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── serp-ranking
│   │   │   └── config.yml
│   │   └── text-to-image
│   │       └── config.yml
│   ├── structured-data-parsing
│   │   ├── freeform-metadata
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── html-entity-recognition
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── pdf-classification
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   └── tabular-data
│   │       ├── config.xml
│   │       └── config.yml
│   ├── time-series-analysis
│   │   ├── activity-recognition
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── change-point-detection
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── outliers-anomaly-detection
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   ├── signal-quality
│   │   │   ├── config.xml
│   │   │   └── config.yml
│   │   └── time-series-forecasting
│   │       ├── config.xml
│   │       └── config.yml
│   └── videos
│       ├── video-classification
│       │   ├── config.xml
│       │   └── config.yml
│       ├── video-frame-classification
│       │   └── config.yml
│       ├── video-object-tracking
│       │   └── config.yml
│       └── video-timeline-segmentation
│           ├── config.xml
│           └── config.yml
├── constants.py
├── core
│   ├── __init__.py
│   ├── all_urls.json
│   ├── api_permissions.py
│   ├── argparser.py
│   ├── asgi.py
│   ├── bulk_update_utils.py
│   ├── context_processors.py
│   ├── current_request.py
│   ├── decorators.py
│   ├── examples
│   │   ├── adv_layouts_columns2
│   │   │   └── config.xml
│   │   ├── adv_layouts_columns3
│   │   │   └── config.xml
│   │   ├── adv_layouts_long_text
│   │   │   └── config.xml
│   │   ├── adv_layouts_sticky_header
│   │   │   └── config.xml
│   │   ├── adv_layouts_sticky_left_column
│   │   │   └── config.xml
│   │   ├── adv_nested_2level
│   │   │   └── config.xml
│   │   ├── adv_nested_3level
│   │   │   └── config.xml
│   │   ├── adv_nested_conditional
│   │   │   └── config.xml
│   │   ├── adv_other_filter
│   │   │   └── config.xml
│   │   ├── adv_other_pairwise
│   │   │   └── config.xml
│   │   ├── adv_other_relations
│   │   │   └── config.xml
│   │   ├── adv_other_table
│   │   │   └── config.xml
│   │   ├── adv_other_table2
│   │   │   └── config.xml
│   │   ├── adv_region_image
│   │   │   └── config.xml
│   │   ├── adv_region_text
│   │   │   └── config.xml
│   │   ├── adv_region_trans
│   │   │   └── config.xml
│   │   ├── adv_text_classification
│   │   │   └── config.xml
│   │   ├── audio_classification
│   │   │   └── config.xml
│   │   ├── audio_diarization
│   │   │   └── config.xml
│   │   ├── audio_emotions
│   │   │   └── config.xml
│   │   ├── audio_trans_region
│   │   │   └── config.xml
│   │   ├── audio_transcribe
│   │   │   └── config.xml
│   │   ├── html_classification
│   │   │   └── config.xml
│   │   ├── html_dialogues
│   │   │   └── config.xml
│   │   ├── html_document
│   │   │   └── config.xml
│   │   ├── html_pdf
│   │   │   └── config.xml
│   │   ├── html_video
│   │   │   └── config.xml
│   │   ├── html_video_timeline
│   │   │   └── config.xml
│   │   ├── html_website
│   │   │   └── config.xml
│   │   ├── image_bbox
│   │   │   └── config.xml
│   │   ├── image_brushes
│   │   │   └── config.xml
│   │   ├── image_circular
│   │   │   └── config.xml
│   │   ├── image_classification
│   │   │   └── config.xml
│   │   ├── image_keypoints
│   │   │   └── config.xml
│   │   ├── image_mixedlabel
│   │   │   └── config.xml
│   │   ├── image_multi_class
│   │   │   └── config.xml
│   │   ├── image_polygons
│   │   │   └── config.xml
│   │   ├── text_alignment
│   │   │   └── config.xml
│   │   ├── text_classification
│   │   │   └── config.xml
│   │   ├── text_multi_class
│   │   │   └── config.xml
│   │   ├── text_named_entity
│   │   │   └── config.xml
│   │   ├── text_summarization
│   │   │   └── config.xml
│   │   ├── ts_classification
│   │   │   └── config.xml
│   │   ├── ts_loading_csv
│   │   │   └── config.xml
│   │   ├── ts_loading_csv_notime
│   │   │   └── config.xml
│   │   ├── ts_loading_headless
│   │   │   └── config.xml
│   │   ├── ts_loading_json
│   │   │   └── config.xml
│   │   ├── ts_multi_step
│   │   │   └── config.xml
│   │   ├── ts_rel_between_channels
│   │   │   └── config.xml
│   │   ├── ts_rel_text
│   │   │   └── config.xml
│   │   └── ts_segmentation
│   │       └── config.xml
│   ├── feature_flags
│   │   ├── README.md
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── example.yml
│   │   ├── stale_feature_flags.py
│   │   └── utils.py
│   ├── filters.py
│   ├── label_config.py
│   ├── management
│   │   ├── __init__.py
│   │   └── commands
│   │       ├── __init__.py
│   │       ├── locked_migrate.py
│   │       └── show_async_migrations.py
│   ├── middleware.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── 0002_deletedrow.py
│   │   ├── 0003_activitylog.py
│   │   ├── __init__.py
│   ├── mixins.py
│   ├── models.py
│   ├── old_ls_migration.py
│   ├── permissions.py
│   ├── redis.py
│   ├── services
│   │   └── audit_log_service.py
│   ├── settings
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── label_studio.py
│   ├── static
│   ├── static_build
│   │   ├── admin
│   ├── storage.py
│   ├── templates
│   │   └── home
│   │       └── home.html
│   ├── templatetags
│   │   └── filters.py
│   ├── tests
│   │   ├── __init__.py
│   │   └── test_models.py
│   ├── urls.py
│   ├── utils
│   │   ├── __init__.py
│   │   ├── common.py
│   │   ├── contextlog.py
│   │   ├── db.py
│   │   ├── exceptions.py
│   │   ├── formatter.py
│   │   ├── io.py
│   │   ├── mail.py
│   │   ├── manifest_assets.py
│   │   ├── openapi_extensions.py
│   │   ├── params.py
│   │   ├── schema
│   │   │   ├── data_examples.json
│   │   │   ├── default_config.json
│   │   │   └── label_config_schema.json
│   │   ├── secret_key.py
│   │   ├── sentry.py
│   │   └── static_serve.py
│   ├── validators.py
│   ├── version.py
│   ├── version_.py
│   ├── views.py
│   └── wsgi.py
├── data_export
│   ├── __init__.py
│   ├── api.py
│   ├── apps.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── 0002_auto_20210921_0954.py
│   │   ├── 0003_auto_20211004_1416.py
│   │   ├── 0004_auto_20211019_0852.py
│   │   ├── 0005_auto_20211025_1137.py
│   │   ├── 0006_convertedformat.py
│   │   ├── 0007_auto_20230327_1910.py
│   │   ├── 0008_convertedformat_traceback.py
│   │   ├── 0009_alter_convertedformat_traceback.py
│   │   ├── 0010_alter_convertedformat_export_type.py
│   │   ├── __init__.py
│   ├── mixins.py
│   ├── models.py
│   ├── serializers.py
│   └── urls.py
├── data_import
│   ├── README.md
│   ├── __init__.py
│   ├── api.py
│   ├── functions.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── 0002_alter_fileupload_file.py
│   │   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── uploader.py
│   └── urls.py
├── data_manager
│   ├── __init__.py
│   ├── actions
│   │   ├── __init__.py
│   │   ├── basic.py
│   │   ├── cache_labels.py
│   │   ├── experimental.py
│   │   ├── next_task.py
│   │   ├── predictions_to_annotations.py
│   │   └── remove_duplicates.py
│   ├── api.py
│   ├── apps.py
│   ├── functions.py
│   ├── managers.py
│   ├── migrations
│   │   ├── 0001_squashed_0005_view_user.py
│   │   ├── 0002_remove_annotations_ids.py
│   │   ├── 0003_remove_predictions_model_versions.py
│   │   ├── 0004_remove_avg_lead_time.py
│   │   ├── 0005_remove_updated_by.py
│   │   ├── 0006_remove_inner_id.py
│   │   ├── 0007_auto_20220708_0832.py
│   │   ├── 0008_manual_counters_update.py
│   │   ├── 0009_alter_view_user.py
│   │   ├── 0010_auto_20230718_1423.py
│   │   ├── 0011_auto_20240718_1355.py
│   │   ├── 0012_alter_view_user.py
│   │   ├── __init__.py
│   ├── models.py
│   ├── prepare_params.py
│   ├── serializers.py
│   ├── templates
│   │   └── data_manager
│   │       └── data.html
│   ├── tests
│   │   ├── __init__.py
│   │   └── actions
│   │       ├── __init__.py
│   │       └── test_basic.py
│   ├── urls.py
│   └── views.py
├── feature_flags.json
├── io_storages
│   ├── README.md
│   ├── __init__.py
│   ├── all_api.py
│   ├── api.py
│   ├── azure_blob
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── form_layout.yml
│   │   ├── models.py
│   │   ├── openapi_schema.py
│   │   ├── serializers.py
│   │   └── utils.py
│   ├── base_models.py
│   ├── filesystem.py
│   ├── functions.py
│   ├── gcs
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── form_layout.yml
│   │   ├── models.py
│   │   ├── openapi_schema.py
│   │   ├── serializers.py
│   │   └── utils.py
│   ├── localfiles
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── form_layout.yml
│   │   ├── models.py
│   │   ├── openapi_schema.py
│   │   └── serializers.py
│   ├── migrations
│   │   ├── 0001_squashed_0002_auto_20210302_1827.py
│   │   ├── 0002_auto_20210311_0530.py
│   │   ├── 0003_localfilesimportstorage.py
│   │   ├── 0004_gcsstoragemixin_google_application_credentials.py
│   │   ├── 0005_s3importstorage_recursive_scan.py
│   │   ├── 0006_auto_20210906_1323.py
│   │   ├── 0007_auto_20210928_1252.py
│   │   ├── 0008_auto_20211129_1132.py
│   │   ├── 0009_auto_20220310_0922.py
│   │   ├── 0010_auto_20221014_1708.py
│   │   ├── 0011_gcsstoragemixin_google_project_id.py
│   │   ├── 0012_auto_20230418_1510.py
│   │   ├── 0013_auto_20230420_0259.py
│   │   ├── 0014_init_statuses.py
│   │   ├── 0015_auto_20230804_1732.py
│   │   ├── 0016_add_aws_sse_kms_key.py
│   │   ├── 0017_auto_20240731_1638.py
│   │   ├── 0018_alter_azureblobexportstorage_project_and_more.py
│   │   ├── 0019_azureblobimportstoragelink_row_group_and_more.py
│   │   ├── __init__.py
│   ├── models.py
│   ├── permissions.py
│   ├── proxy_api.py
│   ├── redis
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── form_layout.yml
│   │   ├── models.py
│   │   ├── openapi_schema.py
│   │   └── serializers.py
│   ├── s3
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── form_layout.yml
│   │   ├── models.py
│   │   ├── openapi_schema.py
│   │   ├── serializers.py
│   │   └── utils.py
│   ├── serializers.py
│   ├── tests
│   │   ├── __init__.py
│   │   ├── factories.py
│   │   ├── test_get_bytes_stream.py
│   │   ├── test_multitask_import.py
│   │   └── test_proxy_api.py
│   ├── urls.py
│   └── utils.py
├── jwt_auth
│   ├── admin.py
│   ├── apps.py
│   ├── auth.py
│   ├── middleware.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── urls.py
│   └── views.py
├── labels_manager
│   ├── __init__.py
│   ├── api.py
│   ├── apps.py
│   ├── exceptions.py
│   ├── functions.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── 0002_auto_20220131_1325.py
│   │   ├── 0003_auto_20221213_1612.py
│   │   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   └── urls.py
├── manage.py
├── ml
│   ├── README.md
│   ├── __init__.py
│   ├── api.py
│   ├── api_connector.py
│   ├── examples
│   │   └── README.md
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── 0002_auto_20210308_1559.py
│   │   ├── 0003_auto_20210309_1239.py
│   │   ├── 0004_auto_20210820_1610.py
│   │   ├── 0005_auto_20211010_1344.py
│   │   ├── 0006_mlbackend_auto_update.py
│   │   ├── 0007_auto_20240314_1957.py
│   │   ├── __init__.py
│   ├── mixins.py
│   ├── models.py
│   ├── serializers.py
│   └── urls.py
├── ml_model_providers
│   ├── README.md
│   ├── __init__.py
│   ├── admin.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── 0002_auto_20240722_2054.py
│   │   ├── 0003_modelproviderconnection_cached_available_models.py
│   │   ├── 0004_auto_20240830_1206.py
│   │   ├── 0005_modelproviderconnection_budget_alert_threshold_and_more.py
│   │   ├── 0006_modelproviderconnection_google_application_credentials_and_more.py
│   │   ├── 0007_alter_modelproviderconnection_provider.py
│   │   ├── 0008_alter_modelproviderconnection_provider.py
│   │   ├── 0009_alter_modelproviderconnection_provider.py
│   │   ├── __init__.py
│   └── models.py
├── ml_models
│   ├── README.md
│   ├── __init__.py
│   ├── admin.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── 0002_modelrun.py
│   │   ├── 0003_auto_20240228_2228.py
│   │   ├── 0004_modelrun_job_id.py
│   │   ├── 0005_auto_20240319_1738.py
│   │   ├── 0006_alter_modelrun_project_subset.py
│   │   ├── 0007_auto_20240617_2200.py
│   │   ├── 0008_modelrun_total_tasks.py
│   │   ├── 0009_alter_thirdpartymodelversion_provider.py
│   │   ├── 0010_modelinterface_skill_name.py
│   │   ├── 0011_thirdpartymodelversion_model_provider_connection.py
│   │   ├── 0012_alter_thirdpartymodelversion_provider.py
│   │   ├── 0013_alter_thirdpartymodelversion_provider.py
│   │   ├── 0014_alter_thirdpartymodelversion_provider.py
│   │   ├── 0015_alter_thirdpartymodelversion_provider.py
│   │   ├── 0016_alter_thirdpartymodelversion_provider.py
│   │   ├── __init__.py
│   └── models.py
├── notifications
│   ├── __init__.py
│   ├── api.py
│   ├── app.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── __init__.py
│   ├── models.py
│   ├── services.py
│   ├── templates
│   │   └── notifications
│   └── urls.py
├── organizations
│   ├── __init__.py
│   ├── admin.py
│   ├── api.py
│   ├── apps.py
│   ├── forms.py
│   ├── functions.py
│   ├── management
│   │   ├── __init__.py
│   │   └── commands
│   │       ├── __init__.py
│   │       └── destroy_organization.py
│   ├── middleware.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── 0001_squashed_0008_auto_20201005_1552.py
│   │   ├── 0002_auto_20210310_2044.py
│   │   ├── 0003_auto_20211010_1339.py
│   │   ├── 0004_organization_contact_info.py
│   │   ├── 0005_organizationmember_deleted_at.py
│   │   ├── 0006_alter_organizationmember_deleted_at.py
│   │   ├── __init__.py
│   ├── mixins.py
│   ├── models.py
│   ├── serializers.py
│   ├── templates
│   │   └── organizations
│   │       └── people_list.html
│   ├── tests
│   │   ├── __init__.py
│   │   ├── factories.py
│   │   └── test_api.py
│   ├── urls.py
│   └── views.py
├── projects
│   ├── README.md
│   ├── __init__.py
│   ├── admin.py
│   ├── api.py
│   ├── fixtures
│   ├── functions
│   │   ├── __init__.py
│   │   ├── next_task.py
│   │   ├── stream_history.py
│   │   └── utils.py
│   ├── management
│   │   └── commands
│   ├── migrations
│   │   ├── 0001_squashed_0065_auto_20210223_2014.py
│   │   ├── 0002_auto_20210304_1457.py
│   │   ├── 0003_auto_20210305_1008.py
│   │   ├── 0003_project_color.py
│   │   ├── 0004_auto_20210306_0506.py
│   │   ├── 0005_merge_20210308_1141.py
│   │   ├── 0006_auto_20210308_1559.py
│   │   ├── 0007_auto_20210309_1304.py
│   │   ├── 0008_auto_20210314_1840.py
│   │   ├── 0009_project_evaluate_predictions_automatically.py
│   │   ├── 0010_auto_20210505_2037.py
│   │   ├── 0011_auto_20210517_2101.py
│   │   ├── 0012_auto_20210906_1323.py
│   │   ├── 0013_project_reveal_preannotations_interactively.py
│   │   ├── 0013_project_skip_queue.py
│   │   ├── 0014_project_parsed_label_config.py
│   │   ├── 0015_merge_20220117_0749.py
│   │   ├── 0016_auto_20220211_2218.py
│   │   ├── 0017_project_pinned_at.py
│   │   ├── 0018_alter_project_control_weights.py
│   │   ├── 0019_labelstreamhistory.py
│   │   ├── 0019_project_project_pinned__a39ccb_idx.py
│   │   ├── 0020_labelstreamhistory_unique_history.py
│   │   ├── 0021_merge_20230215_1943.py
│   │   ├── 0022_projectimport.py
│   │   ├── 0022_projectsummary_created_labels_drafts.py
│   │   ├── 0023_merge_20230512_1333.py
│   │   ├── 0023_projectreimport.py
│   │   ├── 0024_merge_0023_merge_20230512_1333_0023_projectreimport.py
│   │   ├── 0025_project_label_config_hash.py
│   │   ├── 0026_auto_20231103_0020.py
│   │   ├── 0027_project_custom_task_lock_ttl.py
│   │   ├── 0028_auto_20241107_1031.py
│   │   ├── 0029_alter_project_options.py
│   │   ├── 0030_projectproxy_alter_project_options.py
│   │   ├── __init__.py
│   ├── mixins.py
│   ├── models.py
│   ├── permissions.py
│   ├── serializers.py
│   ├── signals.py
│   ├── templates
│   │   ├── includes
│   │   │   ├── project_crumb.html
│   │   │   └── projects_list.html
│   │   └── projects
│   │       ├── create.html
│   │       ├── data.html
│   │       ├── list.html
│   │       └── settings.html
│   ├── templatetags
│   │   ├── __init__.py

│   │   └── custom_filters.py
│   ├── tests
│   │   ├── __init__.py
│   │   ├── factories.py
│   │   ├── test_api.py
│   │   └── test_project_sample_task.py
│   ├── urls.py
│   └── views.py
├── pytest.ini
├── server.py
├── session_policy
│   ├── __init__.py
│   ├── admin.py
│   ├── api.py
│   ├── migrations
│   │   ├── 0001_initial.py
│   │   ├── 0002_alter_sessiontimeoutpolicy_max_session_age_and_more.py
│   │   ├── 0003_alter_sessiontimeoutpolicy_max_session_age_and_more.py
│   │   ├── __init__.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests
│   │   └── test_session_policy.py
│   └── urls.py
├── sitecustomize.py
├── tasks
│   ├── __init__.py
│   ├── api.py
│   ├── choices.py
│   ├── exceptions.py
│   ├── functions.py
│   ├── management
│   │   ├── __init__.py
│   │   └── commands
│   │       ├── __init__.py
│   │       ├── annotations_fill_updated_by.py
│   │       ├── calculate_stats.py
│   │       └── calculate_stats_all_orgs.py
│   ├── migrations
│   │   ├── 0001_squashed_0041_taskcompletionhistory_was_cancelled.py
│   │   ├── 0002_auto_20210304_1423.py
│   │   ├── 0002_auto_20210305_2035.py
│   │   ├── 0003_merge_20210308_1141.py
│   │   ├── 0004_auto_20210308_1559.py
│   │   ├── 0005_auto_20210309_1239.py
│   │   ├── 0006_remove_annotation_state.py
│   │   ├── 0007_auto_20210618_1653.py
│   │   ├── 0008_auto_20210903_1332.py
│   │   ├── 0009_auto_20210913_0739.py
│   │   ├── 0009_auto_20210914_0020.py
│   │   ├── 0010_auto_20210914_0032.py
│   │   ├── 0011_merge_20210914_1036.py
│   │   ├── 0012_auto_20211010_1339.py
│   │   ├── 0013_task_updated_by.py
│   │   ├── 0014_task_inner_id.py
│   │   ├── 0015_task_fill_inner_id.py
│   │   ├── 0016_auto_20220414_1408.py
│   │   ├── 0017_auto_20220330_1310.py
│   │   ├── 0017_new_index_anno_result.py
│   │   ├── 0018_manual_migrate_counters.py
│   │   ├── 0019_merge_20220512_2038.py
│   │   ├── 0020_auto_20220515_2332.py
│   │   ├── 0020_auto_20220516_0545.py
│   │   ├── 0021_auto_20220515_2358.py
│   │   ├── 0022_merge_20220517_1128.py
│   │   ├── 0023_auto_20220620_1007.py
│   │   ├── 0024_manual_migrate_counters_again.py
│   │   ├── 0025_auto_20220721_0110.py
│   │   ├── 0026_auto_20220725_1705.py
│   │   ├── 0027_auto_20220801_1728.py
│   │   ├── 0028_auto_20220802_2220.py
│   │   ├── 0029_annotation_project.py
│   │   ├── 0030_auto_20221102_1118.py
│   │   ├── 0031_alter_task_options.py
│   │   ├── 0032_annotation_updated_by.py
│   │   ├── 0033_annotation_updated_by_fill.py
│   │   ├── 0034_annotation_unique_id.py
│   │   ├── 0034_auto_20221221_1101.py
│   │   ├── 0035_auto_20221221_1116.py
│   │   ├── 0035_tasklock_unique_id.py
│   │   ├── 0036_auto_20221223_1102.py
│   │   ├── 0037_merge_0035_auto_20221221_1116_0036_auto_20221223_1102.py
│   │   ├── 0038_auto_20230209_1412.py
│   │   ├── 0039_annotation_draft_created_at.py
│   │   ├── 0040_auto_20230628_1101.py
│   │   ├── 0041_prediction_project.py
│   │   ├── 0042_auto_20230810_2304.py
│   │   ├── 0043_auto_20230825.py
│   │   ├── 0044_auto_20230907_0155.py
│   │   ├── 0045_auto_20231124_1238.py
│   │   ├── 0046_auto_20240314_1957.py
│   │   ├── 0046_prediction_model_run.py
│   │   ├── 0047_merge_20240318_2210.py
│   │   ├── 0048_failedprediction.py
│   │   ├── 0049_auto_20240905_1602.py
│   │   ├── 0050_alter_predictionmeta_failed_prediction_and_more.py
│   │   ├── 0051_tasklock_created_at.py
│   │   ├── 0052_auto_20241030_1757.py
│   │   ├── 0053_annotation_bulk_created.py
│   │   ├── 0054_add_brin_index_updated_at.py
│   │   ├── 0055_alter_task_options.py
│   │   ├── 0056_alter_task_options.py
│   │   ├── __init__.py
│   ├── mixins.py
│   ├── models.py
│   ├── openapi_schema.py
│   ├── serializers.py
│   ├── tests
│   │   ├── __init__.py
│   │   ├── factories.py
│   │   └── test_api.py
│   ├── urls.py
│   └── validation.py
├── templates
│   ├── 403.html
│   ├── 404.html
│   ├── 500.html
│   ├── admin
│   │   └── base_site.html
│   ├── base.html
│   ├── drf-yasg
│   │   └── redoc.html
│   ├── log_files.html
│   ├── simple.html
│   └── standard_form.html
├── tests
│   ├── __init__.py
│   ├── config_validation.tavern.yml
│   ├── conftest.py
│   ├── create_project.tavern.yml
│   ├── create_project_and_import_data.tavern.yml
│   ├── csrf.tavern.yml
│   ├── data_export.tavern.yml
│   ├── data_import
│   │   ├── __init__.py
│   │   ├── test_persistent_storage_data.py
│   │   └── test_uploader.py
│   ├── data_import.hypertext.tavern.yml
│   ├── data_import.repeater.tavern.yml
│   ├── data_import.tavern.yml
│   ├── data_manager
│   │   ├── __init__.py
│   │   ├── actions
│   │   │   ├── test_cache_labels.py
│   │   │   └── test_predictions_to_annotations.py
│   │   ├── api_tasks.tavern.yml
│   │   ├── columns.tavern.yml
│   │   ├── filters
│   │   │   ├── annotation_results.tavern.yml
│   │   │   ├── float.tavern.yml
│   │   │   ├── float_tasks.json
│   │   │   ├── int.tavern.yml
│   │   │   ├── int_tasks.json
│   │   │   ├── str.tavern.yml
│   │   │   └── str_tasks.json
│   │   ├── tasks_annotations_predictions.json
│   │   ├── test_api_actions.py
│   │   ├── test_api_tasks.py
│   │   ├── test_columns_api.py
│   │   ├── test_ordering_filters.py
│   │   ├── test_undefined.py
│   │   └── test_views_api.py
│   ├── drafts.tavern.yml
│   ├── errors.tavern.yml
│   ├── export.tavern.yml
│   ├── io_storages
│   │   └── s3
│   │       └── test_utils.py
│   ├── io_storages.tavern.yml
│   ├── io_storages_presign_endpoints.tavern.yml
│   ├── io_storages_presign_proxy.tavern.yml
│   ├── jwt_auth
│   │   ├── __init__.py
│   │   ├── test_auth.py
│   │   ├── test_middleware.py
│   │   ├── test_models.py
│   │   ├── test_views.py
│   │   └── utils.py
│   ├── loadtests
│   │   ├── locustfile.py
│   │   ├── locustfile_collabs.py
│   │   ├── locustfile_db_load.py
│   │   ├── one_imports_other_annotate.py
│   │   ├── requirements.txt
│   │   └── run_test.sh
│   ├── local_storage.tavern.yml
│   ├── ml
│   │   ├── test_api.py
│   │   └── test_predict.py
│   ├── ml.tavern.yml
│   ├── next_task.tavern.yml
│   ├── next_task_skip_queue.tavern.yml
│   ├── predictions.model.tavern.yml
│   ├── predictions.tavern.yml
│   ├── project_tasks_api_paging.tavern.yml
│   ├── sdk
│   │   ├── __init__.py
│   │   ├── common.py
│   │   ├── fixtures.py
│   │   ├── legacy
│   │   │   ├── test_annotations.py
│   │   │   ├── test_projects.py
│   │   │   ├── test_storages.py
│   │   │   ├── test_tasks.py
│   │   │   ├── test_users.py
│   │   │   └── test_views.py
│   │   ├── test_annotations.py
│   │   ├── test_export.py
│   │   ├── test_ml.py
│   │   ├── test_predictions.py
│   │   ├── test_projects.py
│   │   ├── test_storages.py
│   │   ├── test_tasks.py
│   │   ├── test_users.py
│   │   ├── test_views.py
│   │   └── utils.py
│   ├── sentry.tavern.yml
│   ├── sessions.tavern.yml
│   ├── shared_stages.yml
│   ├── tasks
│   │   ├── __init__.py
│   │   └── test_functions.py
│   ├── tasks_api.tavern.yml
│   ├── test_annotations.py
│   ├── test_annotations_result_count.py
│   ├── test_api.py
│   ├── test_batch_update_deadlock.py
│   ├── test_bulk_operations.py
│   ├── test_cli.py
│   ├── test_config_validation.py
│   ├── test_contextlog.py
│   ├── test_core.py
│   ├── test_data
│   │   ├── __init__.py
│   │   ├── data_for_test_label_config_matrix.yml
│   │   ├── full_steps.yml
│   │   └── gen_tasks_and_annotations.py
│   ├── test_docs.py
│   ├── test_download_storage.tavern.yml
│   ├── test_endpoints.py
│   ├── test_exception.py
│   ├── test_export.py
│   ├── test_has_lock.py
│   ├── test_invites.py
│   ├── test_io_storages.py
│   ├── test_labels_manager.tavern.yml
│   ├── test_next_task.py
│   ├── test_organizations.py
│   ├── test_predictions.py
│   ├── test_presign_storage_data.py
│   ├── test_project.py
│   ├── test_project_reset_summary.py
│   ├── test_project_validation.py
│   ├── test_projects.tavern.yml
│   ├── test_stream_history.tavern.yml
│   ├── test_suites
│   │   ├── converter.py
│   │   └── samples
│   │       ├── example_repeater.json
│   │       ├── first.jpg
│   │       ├── image_urls.csv
│   │       ├── image_urls_with_bboxes.json
│   │       ├── image_urls_with_bboxes_gt.json
│   │       ├── image_urls_with_classes.csv
│   │       ├── lines.txt
│   │       ├── previous_export.json
│   │       ├── previous_export_unknown_completed_by.json
│   │       ├── random-with-predictions.json
│   │       ├── second.jpg
│   │       ├── test.wrong_ext
│   │       ├── test_1.csv
│   │       ├── test_2.csv
│   │       ├── test_3.csv
│   │       ├── test_4.csv
│   │       ├── test_5.csv
│   │       ├── test_file_without_extension
│   │       ├── test_image.jpg
│   │       ├── test_image.png
│   │       ├── text_with_2_predictions.json
│   │       ├── text_with_2_tasks.json
│   │       ├── three_tasks_two_gts.json
│   │       └── unexisted_s3_links.txt
│   ├── test_tasks_upload.py
│   ├── test_upload_svg.py
│   ├── users.tavern.yml
│   ├── utils.py
│   ├── views.tavern.yml
│   └── webhooks
│       ├── __init__.py
│       ├── organizations.tavern.yml
│       ├── test_webhooks.py
│       └── webhooks.tavern.yml
├── users
│   ├── __init__.py
│   ├── admin.py
│   ├── api.py
│   ├── apps.py
│   ├── forms.py
│   ├── functions
│   ├── functions.py
│   ├── migrations
│   │   ├── 0001_squashed_0009_auto_20210219_1237.py
│   │   ├── 0002_auto_20210308_1559.py
│   │   ├── 0003_user_active_organization.py
│   │   ├── 0004_auto_20210914_0109.py
│   │   ├── 0005_auto_20211010_1339.py
│   │   ├── 0006_user_allow_newsletters.py
│   │   ├── 0007_user_is_deleted.py
│   │   ├── 0008_alter_user_managers.py
│   │   ├── 0009_auto_20231201_0001.py
│   │   ├── 0010_userproducttour.py
│   │   ├── __init__.py
│   ├── mixins.py
│   ├── models.py
│   ├── product_tours
│   │   ├── api.py
│   │   ├── configs
│   │   │   ├── create_prompt.yml
│   │   │   ├── prompts_page.yml
│   │   │   ├── show_ask_ai.yml
│   │   │   └── show_autolabel_button.yml
│   │   ├── models.py
│   │   └── serializers.py
│   ├── serializers.py
│   ├── templates
│   │   └── users
│   │       ├── new-ui
│   │       │   ├── user_base.html
│   │       │   ├── user_login.html
│   │       │   ├── user_signup.html
│   │       │   └── user_tips.html
│   │       ├── user_account.html
│   │       ├── user_base.html
│   │       ├── user_login.html
│   │       └── user_signup.html
│   ├── tests
│   │   ├── __init__.py
│   │   └── factories.py
│   ├── urls.py
│   └── views.py
└── webhooks
    ├── __init__.py
    ├── api.py
    ├── apps.py
    ├── migrations
    │   ├── 0001_initial.py
    │   ├── 0002_auto_20220319_0013.py
    │   ├── 0003_alter_webhookaction_action.py
    │   ├── 0004_auto_20221221_1101.py
    │   ├── __init__.py
    ├── models.py
    ├── serializers.py
    ├── serializers_for_hooks.py
    ├── urls.py
    └── utils.py
```


## OCR-Specific Project Rules

### Project Focus
**IMPORTANT**: This Label Studio instance is specialized for OCR (Optical Character Recognition) labeling only. All features, optimizations, and development should focus exclusively on OCR annotation workflows.

### OCR Template Configuration
The primary OCR template uses the following components:
- **Image**: Display component for OCR documents/images
- **Rectangle**: For drawing bounding boxes around text regions
- **Polygon**: For irregular text region selection
- **TextArea**: For transcribing recognized text (perRegion=true)
- **Labels**: For classifying text types (e.g., 'Text', 'Handwriting')

Standard OCR template structure:
```xml
<View>
  <Image name="image" value="$ocr"/>

  <Labels name="label" toName="image">
    <Label value="Text" background="green"/>
    <Label value="Handwriting" background="blue"/>
  </Labels>

  <Rectangle name="bbox" toName="image" strokeWidth="3"/>
  <Polygon name="poly" toName="image" strokeWidth="3"/>

  <TextArea name="transcription" toName="image"
            editable="true"
            perRegion="true"
            required="true"
            maxSubmissions="1"
            rows="5"
            placeholder="Recognized Text"
            displayMode="region-list"/>
</View>
```

### Django Development Rules for OCR

1. **Model Considerations**:
   - Focus on storing OCR-specific annotations (bounding boxes, polygons, transcribed text)
   - Optimize database queries for large document datasets
   - Store region coordinates efficiently (consider using JSONField for complex polygons)

2. **API Endpoints**:
   - Prioritize endpoints for OCR workflows (document upload, region annotation, text extraction)
   - Implement efficient pagination for large document sets
   - Add OCR-specific filters (by document type, transcription status, confidence scores)

3. **Performance Optimization**:
   - Cache OCR template configurations
   - Optimize image serving for large documents
   - Implement lazy loading for document pages
   - Use database indexes on OCR-specific fields

4. **Validation**:
   - Validate bounding box coordinates are within image bounds
   - Ensure transcribed text is associated with regions
   - Check polygon coordinates form valid shapes
   - Validate OCR confidence scores if applicable

5. **Storage**:
   - Configure appropriate storage backends for OCR documents (S3, GCS, Azure)
   - Implement efficient thumbnail generation for document previews
   - Support multi-page document formats (PDF, TIFF)

6. **Task Management**:
   - Implement OCR-specific task assignment strategies
   - Support batch operations for document sets
   - Track OCR annotation progress per document/page

### OCR-Specific Features to Prioritize

1. **Document Processing**:
   - Multi-page document support
   - Page navigation within tasks
   - Zoom and pan controls for detailed annotation
   - High-resolution image support

2. **Annotation Tools**:
   - Precise bounding box drawing
   - Polygon tool for irregular text regions
   - Text line detection helpers
   - Copy/paste region functionality
   - Bulk region operations

3. **Text Transcription**:
   - Inline text editing per region
   - Spell check integration
   - Special character support
   - RTL/LTR text direction support
   - Font/script type classification

4. **Quality Control**:
   - Confidence score tracking
   - Inter-annotator agreement for OCR tasks
   - Automatic validation of transcriptions
   - Region overlap detection

### Integration Points

1. **ML Backend**:
   - Pre-annotation with OCR engines (Tesseract, Cloud Vision API, etc.)
   - Active learning for difficult regions
   - Model training on corrected annotations

2. **Export Formats**:
   - COCO format for bounding boxes
   - Custom JSON with transcriptions
   - PAGE XML format
   - ALTO XML format
   - Plain text extraction

### Testing Guidelines for OCR Features

1. **Unit Tests**:
   - Test bounding box coordinate validation
   - Test polygon simplification algorithms
   - Test text encoding/decoding for various scripts
   - Test region-text association logic

2. **Integration Tests**:
   - Test full OCR annotation workflow
   - Test multi-page document handling
   - Test export in various OCR formats
   - Test ML backend integration

3. **Performance Tests**:
   - Test with large documents (100+ pages)
   - Test with high-resolution images
   - Test concurrent annotation sessions
   - Test export of large annotation sets

### Common OCR Use Cases to Support

1. **Document Digitization**:
   - Historical document transcription
   - Form data extraction
   - Invoice/receipt processing
   - Book/manuscript digitization

2. **Data Extraction**:
   - Table structure recognition
   - Key-value pair extraction
   - Signature detection
   - Stamp/seal recognition

3. **Multilingual OCR**:
   - Support for various scripts (Latin, Arabic, CJK, etc.)
   - Mixed language documents
   - Historical scripts and fonts

### Performance Metrics to Track

- Average time per document annotation
- Regions annotated per hour
- Characters transcribed per hour
- Annotation accuracy rates
- Model confidence improvements

### Security Considerations

- Sanitize OCR text inputs to prevent XSS
- Validate image uploads for security
- Implement rate limiting on OCR endpoints
- Secure storage of sensitive documents
- Audit logging for document access

### Do NOT Implement

- Audio/video annotation features
- NLP-only tasks without visual component
- Time series annotations
- 3D annotations
- Non-document image annotations (unless specifically requested)


## File Import Flow: From Project to MinIO Storage and Database

### Overview
This section documents the complete flow of file imports from project upload to external storage (MinIO/S3) and database persistence.

### 1. Configuration for MinIO Storage

MinIO is configured as an S3-compatible storage in `label_studio/core/settings/base.py`:

```python
# MinIO Configuration (S3-compatible)
if get_env('MINIO_STORAGE_ENDPOINT') and not get_bool_env('MINIO_SKIP', False):
    AWS_STORAGE_BUCKET_NAME = get_env('MINIO_STORAGE_BUCKET_NAME')
    AWS_ACCESS_KEY_ID = get_env('MINIO_STORAGE_ACCESS_KEY')
    AWS_SECRET_ACCESS_KEY = get_env('MINIO_STORAGE_SECRET_KEY')
    AWS_S3_ENDPOINT_URL = get_env('MINIO_STORAGE_ENDPOINT')
    # Additional S3 settings apply to MinIO
```

Environment variables for MinIO:
- `MINIO_STORAGE_ENDPOINT`: MinIO server URL (e.g., http://localhost:9000)
- `MINIO_STORAGE_BUCKET_NAME`: Default bucket name
- `MINIO_STORAGE_ACCESS_KEY`: MinIO access key
- `MINIO_STORAGE_SECRET_KEY`: MinIO secret key

### 2. File Upload Entry Points

#### API Endpoint: `/api/projects/{id}/import`
- **Handler**: `label_studio/data_import/api.py::ImportAPI`
- **Methods**: POST (file upload), GET (retrieve imports)
- **Parsers**: MultiPartParser, FormParser, JSONParser

#### Key Components:
1. **FileUpload Model** (`data_import/models.py`):
   - Stores uploaded files temporarily
   - Links files to projects and users
   - Handles various formats (CSV, TSV, JSON, images, etc.)

2. **Task Model** (`tasks/models.py`):
   - Core data model for labeling tasks
   - References FileUpload through foreign key
   - Stores task data in JSONField

### 3. Import Flow Steps

#### Step 1: File Reception
```python
# data_import/api.py
class ImportAPI(APIView):
    def post(self, request, *args, **kwargs):
        # 1. Validate file size and extension
        # 2. Create FileUpload instances
        # 3. Process files based on type
```

#### Step 2: File Processing
```python
# data_import/uploader.py
def create_file_uploads(user, project, files):
    # For each uploaded file:
    # 1. Check file size limits (DATA_UPLOAD_MAX_MEMORY_SIZE)
    # 2. Validate extensions (SUPPORTED_EXTENSIONS)
    # 3. Create FileUpload instance
    # 4. Save to configured storage backend
```

#### Step 3: Storage Backend Routing

**Local Storage** (default):
- Files saved to: `MEDIA_ROOT/upload/{project_id}/{uuid}-{filename}`
- Served via Django media URLs

**MinIO/S3 Storage** (when configured):
- Uses `S3ImportStorage` model (`io_storages/s3/models.py`)
- Files uploaded to bucket with prefix structure
- Supports presigned URLs for direct access

#### Step 4: Task Creation
```python
# data_import/functions.py
def load_tasks(request, project, file_uploads):
    # For each FileUpload:
    # 1. Parse file content based on format
    # 2. Create Task instances with data
    # 3. Link tasks to FileUpload
    # 4. Update project counters
```

### 4. Database Models Structure

#### FileUpload Model
```python
class FileUpload(models.Model):
    user = ForeignKey('users.User')
    project = ForeignKey('projects.Project')
    file = FileField(upload_to=upload_name_generator)
    # Tracks uploaded files and their metadata
```

#### Task Model
```python
class Task(models.Model):
    data = JSONField()  # Actual task data
    meta = JSONField()  # Metadata
    project = ForeignKey('projects.Project')
    file_upload = ForeignKey('data_import.FileUpload')
    # Core task data with file reference
```

#### S3ImportStorage Model
```python
class S3ImportStorage(S3StorageMixin, ImportStorage):
    bucket = TextField()
    prefix = TextField()
    aws_access_key_id = TextField()
    aws_secret_access_key = TextField()
    s3_endpoint = TextField()  # MinIO endpoint
    # Manages S3/MinIO storage connections
```

#### S3ImportStorageLink Model
```python
class S3ImportStorageLink(ImportStorageLink):
    storage = ForeignKey(S3ImportStorage)
    key = TextField()  # S3 object key
    task = ForeignKey(Task)
    # Links tasks to S3 objects
```

### 5. MinIO-Specific Implementation

#### Connection Setup
```python
# io_storages/s3/models.py
class S3StorageMixin:
    def get_client_and_resource(self):
        # Creates boto3 client with MinIO endpoint
        return get_client_and_resource(
            self.aws_access_key_id,
            self.aws_secret_access_key,
            self.aws_session_token,
            self.region_name,
            self.s3_endpoint  # MinIO URL
        )
```

#### File Operations
```python
# Scanning for files
def iter_keys(self):
    # Lists all objects in MinIO bucket
    # Applies regex filters if configured
    # Yields keys for task creation

# Reading data
def get_data(self, key):
    # Fetches object from MinIO
    # Parses content based on format
    # Returns task data

# URL generation
def generate_http_url(self, url):
    # Creates presigned URLs for direct access
    # Configurable TTL for security
```

### 6. Import Workflow for OCR Documents

For OCR-specific imports:

1. **Image Upload**: 
   - Images uploaded via API or UI
   - Stored in MinIO with project prefix
   - FileUpload record created

2. **Task Creation**:
   - Task data contains S3 URL reference
   - Format: `{"ocr": "s3://bucket/path/to/image.jpg"}`
   - Task linked to FileUpload

3. **Storage Link**:
   - S3ImportStorageLink created
   - Maps task to MinIO object
   - Enables sync and updates

4. **Access Pattern**:
   - Frontend requests image URL
   - Backend generates presigned URL
   - Direct access from MinIO for performance

### 7. Async Processing

For large imports:
```python
# Background job processing
start_job_async_or_sync(
    async_import_background,
    project,
    file_upload_ids,
    user
)
```

### 8. Error Handling

- File size validation: `DATA_UPLOAD_MAX_MEMORY_SIZE`
- Extension validation: `SUPPORTED_EXTENSIONS`
- Duplicate detection via storage links
- Transaction rollback on failures

### 9. Key Configuration Settings

```python
# Important settings for imports
DATA_UPLOAD_MAX_MEMORY_SIZE = 250MB  # Max file size
DATA_UPLOAD_MAX_NUMBER_FILES = 100   # Max files per import
TASKS_MAX_NUMBER = 1000000           # Max tasks per project
TASKS_MAX_FILE_SIZE = 250MB          # Max total import size
SYNC_ON_TARGET_STORAGE_CREATION = True  # Auto-sync on storage creation
```

### 10. Docker Compose MinIO Setup

When running with docker-compose.minio.yml:
```yaml
minio:
  image: minio/minio
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  command: server /data
  
app:
  environment:
    MINIO_STORAGE_ENDPOINT: http://minio:9000
    MINIO_STORAGE_BUCKET_NAME: label-studio
    MINIO_STORAGE_ACCESS_KEY: minioadmin
    MINIO_STORAGE_SECRET_KEY: minioadmin
```

### Common Import Patterns

1. **Direct File Upload**: File → FileUpload → Task → Database
2. **S3 Sync Import**: S3 Bucket → S3ImportStorage → Tasks → Database  
3. **Bulk Import**: Multiple Files → Background Job → Batch Task Creation
4. **Re-import**: Existing Storage → Scan for Changes → Update Tasks

### Debugging Import Issues

1. Check logs in: `/label-studio/data/logs/`
2. Verify MinIO connection: `boto3.client.list_buckets()`
3. Check FileUpload records: `FileUpload.objects.filter(project=project)`
4. Verify storage links: `S3ImportStorageLink.objects.filter(storage=storage)`
5. Monitor background jobs: Django RQ dashboard at `/django-rq/`
