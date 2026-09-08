# Motion across Tally

Motion acknowledges an action without postponing saving, navigation or an updated count. It runs once, then rests.

- Web: 6px, 320ms arrivals for the landing and dashboard; at most 120ms of card staggering; 2% button compression; a quarter-turn plus icon; 350ms progress fills. Shared tally displays and dashboard totals acknowledge increases with a 3.5% settling pulse.
- iOS: shared press styling on custom controls, a 3.5% acknowledgement on new tally counts and dashboard totals, and settling dashboard progress. Keyframe animation replaces the unused tally animation state. Native sheets retain their system transitions.
- Android: shared 2% press feedback on logging controls, 350ms progress fills and a 3.5% tally acknowledgement on dashboard/detail screens. Material ripples and native navigation remain intact.
- Reduced motion: CSS follows the media query, SwiftUI reads the accessibility environment, and Compose observes changes to the system animator scale while the app is open. No pulse or stagger runs with reduced motion enabled. Data and accessible counts always update immediately.

There are no looping decorative effects, added animation libraries, delayed writes, confetti or animated intermediate numbers. Repeated input interrupts feedback rather than queuing it.

The TestFlight runner uses macOS 26 / Xcode 26.2 to meet Apple's current upload requirements. Automatic releases serialize and skip superseded main commits.
