---
title: The Longitude Problem
slug: longitude-problem
summary: For three centuries, the most important scientific problem in Europe was a problem of timekeeping — and the solution came not from the astronomers it was supposed to come from, but from a self-taught carpenter.
status: complete
featured: true
updated: 2026-05-10
tags: [cartography, science, history, craft]
pillar: cartography
order: 2
geo:
  lat: 51.48
  lng: 0.0
  place: Greenwich, England
  precision: city
era:
  start: 1500
  end: 1770
images:
  - src: hero.jpg
    role: hero
    source: external
    credit: "Wikimedia Commons — National Maritime Museum"
    license: "Public Domain"
    url: https://commons.wikimedia.org/wiki/File:Harrison%27s_Chronometer_H5.JPG
related: [eratosthenes-and-the-first-globe, mercator-projection, gps-and-the-end-of-being-lost]
sources:
  - title: "Longitude — Dava Sobel"
    url: https://en.wikipedia.org/wiki/Longitude_(book)
  - title: "The Quest for Longitude — William Andrewes (ed.)"
    url: https://www.harvard.edu/
---

Latitude is easy. The angular height of the noon sun above the horizon, or — at night — the angular height of Polaris, gives you the latitude to within a fraction of a degree using nothing but a graduated metal arc. Polynesian navigators read latitude by the stars; Roman sailors read it by the sun; medieval Arab astronomers refined the technique with the astrolabe.

Longitude is hard. Brutally, century-bendingly hard. It tortured the European seafaring nations for three hundred years, killed thousands of sailors who ran their ships onto rocks they did not know they were near, and was finally solved — to the considerable embarrassment of the astronomical establishment — by a Yorkshire carpenter who spent forty-three years building four clocks.

## Why it is hard

The Earth rotates 360 degrees in 24 hours. That means each hour of difference between the local time at your position and the local time at some reference position (a "prime meridian") corresponds to fifteen degrees of longitude. If you are at sea, and you know the time at Greenwich, and you can measure the local time at your current position by observing when the sun reaches its highest point overhead, you can subtract one from the other and solve for your longitude.

The trouble is the *and you know the time at Greenwich* part. To know the time at Greenwich while you are bobbing on a ship in the middle of the Atlantic, you need either:

1. **A clock that has carried Greenwich time with it from England**, and which is reliable enough at sea — through temperature change, humidity, salt air, ship motion, and weeks or months of continuous running — that the accumulated error after a long voyage is small enough to be useful.
2. **An astronomical clock visible from the ship**: some celestial event you can observe directly, and whose Greenwich time you can look up from a precomputed table.

Both approaches were tried, exhaustively, for centuries.

## The astronomical method

The astronomical approach was the one most respected scientific authority believed in. The Royal Observatory at Greenwich was, in fact, founded by Charles II in 1675 specifically to compile the astronomical tables required for the *lunar distance method*: a navigator measures the angular distance between the moon and a chosen star, looks up in a table the Greenwich time at which that distance occurred, and thereby derives the time at Greenwich.

The method works in principle. It works in practice only with very good lunar tables, very good angular measurements, very good math, and an hour or so of computation per observation. The lunar tables required by the method took seventy years to compile to acceptable accuracy. The instrument required — a sextant capable of reading angles to about one arcminute — only became practical in the mid-eighteenth century. The math is a series of spherical-triangle reductions that an averagely educated mariner could not perform without retraining.

The astronomical method was, in 1750, *almost* viable, and it was the official solution favored by the Board of Longitude — the British government commission established by the Longitude Act of 1714, which offered a £20,000 prize (perhaps £4 million in modern money) for anyone who could solve the problem to within half a degree on a voyage to the West Indies.

## John Harrison's clocks

John Harrison was a self-taught carpenter and clockmaker from rural Yorkshire. He was not a scientist, not a Royal Society member, not connected. He was, however, brilliantly good at building clocks.

Harrison spent his life trying to make a marine timekeeper. His first prototype, *H1*, was completed in 1735 — a cabinet-sized assembly of brass and lignum vitae weighing about thirty-five kilograms, with no pendulum (which would have been useless on a moving ship) but a pair of counter-oscillating dumbbell balances connected by cross-springs, designed to be insensitive to the ship's motion and immune to thermal expansion. *H1* performed well enough on a sea trial to Lisbon to win him a development grant from the Board.

He spent the next twenty years building *H2* (1741) and *H3* (1759). Both were vastly more complicated, and both ultimately disappointed him. The break came when he gave up on the dumbbell-balance approach and built *H4* (1759) — a five-inch silver pocket watch, an entirely different machine in conception. It used a small, fast-beating balance wheel with a temperature-compensated bimetallic strip and a remontoire mechanism (a small subsidiary spring rewound several times a minute, to give the escapement a constant force regardless of the main spring's state of wind).

*H4* was tested on a voyage to Jamaica in 1761–62. After an outbound voyage of 81 days, it was off by 5.1 seconds. That corresponds to a longitude error of about 1.25 nautical miles. The Board's prize threshold, on a West Indies voyage, was about 30 miles.

He had won, technically, on the first attempt. The Board, deeply embarrassed by the success of an unconnected provincial outsider, declined to award the prize. Harrison spent the next decade in a humiliating series of further trials, regulatory delays, and demands that he disclose the watch's construction. He was eventually awarded what amounted to the prize money in 1773 — by direct intervention of King George III, who had become personally annoyed at the Board's treatment of him — when Harrison was eighty.

He died three years later. The technology he developed — the temperature-compensated bimetallic strip, the remontoire, the diamond-pallet escapement — passed into the next generation of marine chronometers, which were being mass-produced by London makers like Larcum Kendall and Thomas Earnshaw within twenty years of Harrison's death.

## The astronomical aftermath

The astronomical method also matured. By the end of the eighteenth century, both the lunar distance method and the marine chronometer method were viable, and ships' captains typically carried instruments and tables for both, using them as cross-checks. The chronometer method was faster and required less skill; the lunar distance method was a backup if the chronometer failed.

By 1850, every serious British ship carried a chronometer. By 1900, the cost of chronometers had fallen far enough that they were standard equipment on small commercial vessels. The longitude problem was, at that point, no longer a problem.

## Why it matters

The longitude problem is one of the cleanest historical cases of a *politically defined* scientific question generating an *engineering* answer. The Board of Longitude was looking for an astronomical solution. It got a horological one. The Royal Society was looking for a Cambridge mathematician. It got a Yorkshire carpenter. The institutional gatekeepers were unhappy in both cases, and right in both cases — the question they had defined was answerable, and someone outside the institution they had imagined would answer it answered it.

That pattern — the question is harder than the institution thinks, the solution comes from outside the institution, the institution adjusts grudgingly and absorbs the result — is repeatedly visible in the history of navigation, of public health, of agriculture, of computing. The longitude story is the version of it that historians most often reach for because the documentation is so good.

## What stayed with me

That a marine chronometer the size of a pocket watch — an object whose modern descendant is the quartz watch on most people's wrists — was, in 1762, the most precisely engineered object in the world, and that the entire global navigation infrastructure of the British Empire and its successors rested, for a century and a half, on the descendants of one man's stubborn refusal to give up after his first three machines did not work.
