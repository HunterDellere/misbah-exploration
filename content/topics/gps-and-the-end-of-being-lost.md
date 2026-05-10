---
title: GPS and the End of Being Lost
slug: gps-and-the-end-of-being-lost
summary: A military system designed in the 1970s to guide nuclear submarines became, within a generation, an invisible utility on which the global economy and the human sense of place both quietly depend.
status: complete
featured: true
updated: 2026-05-10
tags: [cartography, science, history]
pillar: cartography
order: 5
geo:
  lat: 38.83
  lng: -104.82
  place: Schriever Space Force Base, Colorado
  precision: city
era:
  start: 1973
  end: present
images:
  - src: hero.jpg
    role: hero
    source: external
    credit: "Wikimedia Commons — NASA/USAF"
    license: "Public Domain"
    url: https://commons.wikimedia.org/wiki/File:GPS_Satellite_NASA_art-iif.jpg
related: [blue-marble, longitude-problem, mercator-projection]
sources:
  - title: "Pinpoint: How GPS is Changing Technology, Culture, and Our Minds — Greg Milner"
    url: https://wwnorton.com/books/Pinpoint
  - title: "GPS Program Office (Space Force) overview"
    url: https://www.gps.gov/
---

When the United States Air Force launched the first NAVSTAR-GPS satellite in 1978, the system was a Cold War military project: a global, all-weather, twenty-four-hour navigation aid intended primarily to guide ballistic missile submarines, strategic bombers, and ground forces. It was classified. It was expensive. It was conceived as a system the United States would use against, or in spite of, an adversary capable of jamming any other navigational signal.

By 2000 the same system was in cars, in fishing boats, in agricultural combines, in shipping containers, in pacemakers, and within seven years in nearly every smartphone in the world. The transformation from secret weapons system to invisible utility took less than thirty years and was, both technically and politically, less inevitable than it now looks.

## How it works

A constellation of approximately twenty-four to thirty-two GPS satellites orbits the Earth at about 20,200 km altitude, completing one orbit every twelve hours. Each satellite continuously broadcasts its current orbital position and the precise time according to the atomic clock on board.

A receiver — your phone, a car GPS unit, a survey instrument — listens for these signals. The signal from any one satellite tells the receiver: *the satellite was at this position when this signal was sent at this time*. The signal arrives at the receiver fractionally later, because radio waves travel at the speed of light but are not instantaneous. By measuring the arrival delay, the receiver can compute its distance from the satellite. With distances from at least four satellites simultaneously, the receiver can solve a system of equations that yields its three-dimensional position and the offset of its own clock from GPS time.

The math is straightforward; the engineering is brutal. The atomic clocks on the satellites must be stable to within a few nanoseconds. The orbital positions of the satellites must be known and updated continuously by ground stations. Relativistic corrections are required: the satellites' clocks tick *faster* than ground clocks by about 38 microseconds per day (special and general relativity in opposite directions, with general relativity dominating because the satellites are higher in Earth's gravity well), and this correction must be built into the system. Without it, GPS positions would drift by about ten kilometers per day. Relativity is, in this sense, an engineering necessity, not a thought experiment.

## The civilian opening

GPS was conceived as a military system, and the original plan was that civilian users would receive a degraded signal — *Selective Availability*, an intentionally introduced random error in the broadcast time that limited civilian accuracy to about 100 meters. Military receivers would have the cryptographic key needed to remove the error and obtain accuracy of around 5 meters.

In September 1983, the Soviet Union shot down Korean Air Lines Flight 007, a 747 that had drifted into Soviet airspace because of a navigation error. President Ronald Reagan responded by directing that GPS be made freely available to civilian aviation worldwide once the system was operational, "as a common good." The promise was kept formally, though Selective Availability remained for civilian receivers for another seventeen years.

In May 2000, President Bill Clinton ordered Selective Availability turned off. Civilian GPS accuracy improved overnight from about 100 meters to about 5 meters. Almost the entire civilian GPS economy — turn-by-turn navigation, smartphone location services, precision agriculture, surveying, the "find my phone" infrastructure — became practical at that moment. Industries that had been using GPS for niche applications scaled in the months that followed; industries that had been waiting for accuracy to improve started building.

The decision to turn off Selective Availability was, on the merits, one of the most economically consequential single executive actions of the late twentieth century. The civilian value of high-accuracy GPS has been estimated at hundreds of billions of dollars per year. The decision is also instructive politically: it was a unilateral act of the United States, by an executive order, on a system the United States operates and pays for. The fact that the global economy now runs on a free-to-use service maintained at U.S. taxpayer expense is occasionally the subject of strategic discussion. It has not, so far, been substantially altered.

## The competing systems

The dependency of the global economy on a single American military system has not gone unnoticed. There are now three other operational global navigation satellite systems:

- **GLONASS** (Russian Federation) — operational since 1995, restored to full service in 2011 after a long period of degradation. Comparable accuracy.
- **Galileo** (European Union) — declared initial operational capability in 2016, full operational capability in 2024 (formally). Designed as a civilian-controlled system from the start.
- **BeiDou** (People's Republic of China) — global operational coverage since 2020. Comparable accuracy; active military and civilian programs.

A modern smartphone receiver typically uses signals from all four constellations simultaneously, which both improves accuracy (more satellites in view at any moment) and provides redundancy against the loss of any single system.

## What the dependency has done

GPS has become so reliable, and so cheap, that an enormous range of industrial and civilian processes that used to be done by other means have been quietly retooled around GPS. Continuous-tense examples:

- The *time signal* from GPS — separately useful from its position signal — synchronizes the world's electric grids, financial trading systems, cellular networks, and atomic-clock-derived public time services. Removing GPS time from a major financial center for a few hours produces immediate, expensive errors.
- *Precision agriculture* uses GPS-guided tractors that drive themselves down rows with centimeter accuracy, allowing reduced overlap and chemical use.
- *Aviation* has shifted from VOR and DME ground beacons toward GPS-based RNAV and RNP procedures.
- *Shipping* and *port logistics* run on GPS-tagged container tracking.
- *Personal navigation* — the smartphone in the pocket — has retired most of the hard-won spatial skills that previous human generations relied on. Whether this is good or bad is contested; that it is real is not.

The dependency means that GPS jamming and GPS spoofing are, in the 2020s, active concerns. Reports of localized GPS denial near combat zones, near sensitive military sites, and near specific maritime regions have been steadily increasing. The infrastructure is robust, but it is not invulnerable.

## What stayed with me

That the longitude problem — three centuries of British naval expense, the £20,000 prize, John Harrison's forty years of clockmaking — has been, in our generation, *solved* in the sense that it has been engineered out of existence as a problem. Anyone with a five-dollar GPS chip can know their position to within five meters anywhere on Earth, instantly, continuously, in any weather, day or night. The thing that an entire eighteenth-century scientific establishment could not deliver, a sand-grain-sized piece of silicon delivers without thinking about it.

That this engineering achievement is also a quiet erosion of the human capacity *to be lost* is the kind of trade the history of technology is full of. Most people have decided it is worth it. It is still useful to know we made the trade.
