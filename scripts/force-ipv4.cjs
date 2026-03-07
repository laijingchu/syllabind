// Forces Node.js to prefer IPv4 for all DNS lookups.
// Fixes connectivity issues on networks with broken IPv6 routing.
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
