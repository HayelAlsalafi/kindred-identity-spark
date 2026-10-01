import { db, topicsTable } from "@workspace/db";

const topics = [
  {
    slug: "networking-fundamentals",
    name: "Networking Fundamentals",
    description:
      "Build a strong base in Ethernet, TCP/IP, and network communication.",
    displayOrder: 10,
    status: "ACTIVE" as const,
  },
  {
    slug: "ipv4-subnetting",
    name: "IPv4 Addressing & Subnetting",
    description:
      "Practice address planning, subnet masks, and efficient network design.",
    displayOrder: 20,
    status: "ACTIVE" as const,
  },
  {
    slug: "ethernet-switching",
    name: "Ethernet LAN Switching",
    description:
      "Understand VLANs, switching behavior, and LAN architecture.",
    displayOrder: 30,
    status: "ACTIVE" as const,
  },
  {
    slug: "routing-basics",
    name: "IPv4 Routing Basics",
    description:
      "Learn how routers make forwarding decisions and connect networks.",
    displayOrder: 40,
    status: "ACTIVE" as const,
  },
  {
    slug: "device-management",
    name: "Device Management Protocols",
    description:
      "Work with CLI access, management protocols, and secure device operations.",
    displayOrder: 50,
    status: "ACTIVE" as const,
  },
];

await db.insert(topicsTable).values(topics).onConflictDoNothing();
console.log(`Seeded ${topics.length} CCNA topics.`);