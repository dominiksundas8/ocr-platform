from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    """
    Rimuove null=True dal campo user del modello Document.
    Ogni documento deve obbligatoriamente appartenere a un utente.
    I record esistenti con user=NULL vengono eliminati prima dell'alter column.
    """

    dependencies = [
        ('api', '0004_alter_document_file'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Prima eliminiamo eventuali record orfani (documenti senza utente)
        migrations.RunSQL(
            sql="DELETE FROM api_document WHERE user_id IS NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Poi rendiamo il campo obbligatorio (rimuoviamo null=True)
        migrations.AlterField(
            model_name='document',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='documents',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
