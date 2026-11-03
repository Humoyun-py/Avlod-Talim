from django.db import migrations, models


def move_images_and_rename_link_type(apps, schema_editor):
    AssignmentSubmission = apps.get_model("core", "AssignmentSubmission")
    SubmissionImage = apps.get_model("core", "SubmissionImage")
    Assignment = apps.get_model("core", "Assignment")
    for submission in AssignmentSubmission.objects.exclude(image="").exclude(image__isnull=True):
        SubmissionImage.objects.create(submission=submission, image=submission.image.name)
    for assignment in Assignment.objects.all():
        types = ["link" if value == "github_link" else value for value in assignment.submission_types]
        if types != assignment.submission_types:
            assignment.submission_types = types
            assignment.save(update_fields=["submission_types"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0007_audit_and_review_set_null"),
    ]

    operations = [
        migrations.CreateModel(
            name="SubmissionImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="submissions/images/")),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                ("submission", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="images", to="core.assignmentsubmission")),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.RenameField(
            model_name="assignmentsubmission",
            old_name="github_url",
            new_name="link_url",
        ),
        migrations.AlterField(
            model_name="assignmentsubmission",
            name="link_url",
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.RunPython(move_images_and_rename_link_type, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="assignmentsubmission",
            name="image",
        ),
    ]
