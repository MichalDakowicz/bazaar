# Ping backend cutover

Bazaar's cutover build uses Ping's dedicated backend and a new app-specific auth
storage key. Sign in again after updating. Scoped reconciliation preserves the
existing account IDs, lists, memberships, items, trips, activity and preferences.
No full cloud snapshot may replace the populated Ping database.

The existing Firebase Hosting URL is preserved. Android acceptance comes before
web deployment. Release checks include list-member/non-member/anonymous access,
attribution triggers, trip/list-mode RPCs, Realtime, QR and native sibling sign-in.
The other migrated Ping apps need matching reciprocal updates before handoff.
Radar and Cellar remain excluded.

Operational evidence stays private. Build, handset and web acceptance are pending.
