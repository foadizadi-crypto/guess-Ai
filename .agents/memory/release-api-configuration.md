---
name: Release API configuration
description: Native release clients need an explicitly provisioned HTTPS API URL because Replit dev workflow variables are not present in EAS builds.
---

Release mobile builds do not inherit the Replit dev workflow's API URL. They must receive `EXPO_PUBLIC_API_URL` from the EAS environment, and that value must be a reachable HTTPS production deployment rather than a workspace dev domain or localhost.

**Why:** A missing release URL previously fell back to localhost; API requests from a physical Android device then never completed, leaving the game question spinner active indefinitely.

**How to apply:** Publish the API service first, set its `https://...replit.app` or verified custom domain as the EAS environment variable, and only then create a release APK.