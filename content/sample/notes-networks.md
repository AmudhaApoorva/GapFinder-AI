# Notes — Computer Networks
Source: chapter outline used for pre-board revision.

## Communication model
A message travels from a sender to a receiver over a transmission medium, following a protocol. Bandwidth is the capacity of the medium, often described in bits per second. Latency is delay. High bandwidth does not automatically mean low latency (satellite links can be wide but delayed).

## Media
Twisted pair is cheap and common in school LANs (CAT5e/CAT6). Coaxial cable is older, used in some TV and older Ethernet. Optical fibre uses light, resists electromagnetic interference, and is preferred for long distance and high bandwidth backbones. Unguided media: radio for Wi-Fi, microwave for line-of-sight links, infrared for very short range, satellite for remote areas.

## Devices
A modem modulates and demodulates analog signals for telephone-line or similar access. A NIC / Ethernet card connects a computer to the wired network. RJ45 is the connector for twisted pair Ethernet. A repeater regenerates a signal. A hub forwards bits to every port (shared collision domain). A switch forwards frames using MAC addresses and is preferred in labs. A router forwards packets between networks using IP addresses. A gateway connects networks that use different protocols.

## Types and topologies
PAN: Bluetooth headset. LAN: school computer lab. MAN: city-wide cable network. WAN: the Internet spanning countries. Bus topology is simple but a backbone fault affects all. Star topology has a central switch; one cable fault affects one host, which is why labs use it. Mesh is robust but expensive.

## Protocols students mix up
TCP is connection-oriented and reliable (acknowledgements, retransmission). UDP is connectionless and faster, used when a lost packet is acceptable (some streaming, DNS queries). HTTP requests web pages; HTTPS is HTTP with encryption. FTP transfers files. SMTP sends email; POP3 and IMAP receive email (IMAP keeps mail on the server). TELNET is remote login in clear text (historically); SSH is the secure replacement though SSH is beyond some school lists. VoIP carries voice over IP. DNS maps domain names to IP addresses. IP addressing identifies hosts; IPv4 uses 32-bit addresses written as four octets.

## Internet versus WWW
The Internet is the global network of networks. The World Wide Web is a service on the Internet that uses HTTP and hyperlinked documents. Email and FTP also use the Internet but are not the Web.
