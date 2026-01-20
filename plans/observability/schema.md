# Observability schema (canonical)

## Event names (PostHog + logs)
- app_opened
- auth_signed_in
- auth_signed_out
- challenge_created
- challenge_updated
- challenge_archived
- entry_created
- entry_updated
- entry_deleted
- data_export_started
- data_export_completed
- data_import_started
- data_import_completed

## Common properties (all platforms)
- platform: web | ios | android
- env: development | preview | production
- app_version
- build_number
- user_id
- is_signed_in
- session_id
- trace_id
- span_id
- request_id

## Domain properties (when relevant)
- challenge_id
- timeframe_unit
- target_number
- entry_id
- entry_count
- has_note
- has_sets
- feeling

## Wide event log envelope
- type: "wide_event"
- event
- timestamp (ISO-8601)
- plus common + domain properties
