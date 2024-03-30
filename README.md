# Scooter Speed Util

Intended for Segway Ninebot Max G2

Based on this document:

[Random document linked to from Reddit](https://docs.google.com/document/u/0/d/16Icy_Hvx-j-amCTEWHQFzNtZo-mmGzmv6Cl0qIfyGzM/mobilebasic)

Gets service: 6E400001-B5A3-F393-E0A9-E50E24DCCA9E
Updates characteristic: 6E400002-B5A3-F393-E0A9-E50E24DCCA9E

Writes a byte array of:
`55AB4D41583253636F6F7465725F31` to increase speed
`55AB4D41583253636F6F7465725F30` to go back to normal speeds
