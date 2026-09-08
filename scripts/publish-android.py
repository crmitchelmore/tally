"""Upload only a draft to an explicitly selected testing track; never silently publish production."""
import json
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

package = os.environ['ANDROID_PACKAGE_NAME']
if package != 'com.tally.app':
    raise RuntimeError('Configured Play package differs from the built applicationId')
track = os.environ.get('PLAY_TRACK', 'internal')
if track not in ('internal', 'alpha'):
    raise RuntimeError('Only internal and closed testing tracks are configured')
credentials = service_account.Credentials.from_service_account_info(
    json.loads(os.environ['GOOGLE_PLAY_SERVICE_ACCOUNT_JSON']),
    scopes=['https://www.googleapis.com/auth/androidpublisher'])
service = build('androidpublisher', 'v3', credentials=credentials, cache_discovery=False)
edit = service.edits().insert(packageName=package, body={}).execute()['id']
committed = False
try:
    bundle = service.edits().bundles().upload(packageName=package, editId=edit,
        media_body=MediaFileUpload('app/build/outputs/bundle/release/app-release.aab',
                                  mimetype='application/octet-stream', resumable=True)).execute()
    version = str(bundle['versionCode'])
    service.edits().tracks().update(packageName=package, editId=edit, track=track, body={
        'track': track, 'releases': [{'name': 'Tally 1.9.0', 'versionCodes': [version], 'status': 'draft',
        'releaseNotes': [{'language': 'en-GB', 'text': 'A friendlier Tally: refreshed design, subtle animations, optional analytics and crash-reporting choices, and clearer privacy controls.'}]}]}).execute()
    service.edits().validate(packageName=package, editId=edit).execute()
    service.edits().commit(packageName=package, editId=edit).execute()
    committed = True
    print(f'Saved Google Play {track} draft for {package}, version code {version}')
finally:
    if not committed:
        service.edits().delete(packageName=package, editId=edit).execute()
