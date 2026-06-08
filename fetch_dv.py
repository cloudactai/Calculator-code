"""
fetch_dv.py
-----------
Fetches the dynamic_values (DV) dict from the CloudAct backend API.

The API returns an array of records like:
    [{"Name": "BasicPersonalAmountFed", "Value": 16129.00, ...}, ...]

This module flattens province + FED arrays into a single dict keyed by Name.

Usage (in inspect_tax.py / smoke_test_tax.py):
    from fetch_dv import fetch_dv
    DV = fetch_dv(year=2025, province="ON")

Or run directly to inspect what the API returns:
    python3 fetch_dv.py
"""

import requests

# ── Config ────────────────────────────────────────────────────────────────────

BASE_URL = "http://localhost:3000/v1"

# If the API requires a Bearer token, set it here (or pass via argument).
# Leave as None to make unauthenticated requests.
AUTH_TOKEN: str | None = None


# ── Core function ─────────────────────────────────────────────────────────────

def fetch_dv(
    year: int,
    province: str,
    base_url: str = BASE_URL,
    token: str | None = AUTH_TOKEN,
) -> dict:
    """
    Fetch dynamic values for `year` / `province` from the CloudAct API and
    return a flat dict keyed by Name, e.g. {"BasicPersonalAmountFed": 16129.0}.

    Hits two endpoints (mirrors the frontend fetchAllDynamicValues call):
        GET /dynamic_values_by_year/{year}/{province}
        GET /dynamic_values_by_year/{year}/FED

    Args:
        year:      Tax year, e.g. 2025
        province:  Province code, e.g. "ON"
        base_url:  API base URL (default: http://localhost:3000/v1)
        token:     Bearer token for Authorization header (optional)

    Returns:
        dict mapping Name -> Value for all province + federal dynamic values.
    """
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    def _get(url: str) -> list:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        # Handle both {"body": [...]} wrapper and bare array responses
        if isinstance(data, dict) and "body" in data:
            return data["body"]
        if isinstance(data, list):
            return data
        raise ValueError(f"Unexpected response shape from {url}: {data!r}")

    province_url = f"{base_url}/dynamic_values_by_year/{year}/{province}"
    federal_url  = f"{base_url}/dynamic_values_by_year/{year}/FED"

    province_records = _get(province_url)
    federal_records  = _get(federal_url)

    combined = province_records + federal_records

    # Flatten to {Name: Value}
    dv = {}
    for record in combined:
        name  = record.get("Name")  or record.get("name")
        value = record.get("Value") or record.get("value")
        if name is not None and value is not None:
            dv[name] = float(value)

    return dv


# ── CLI helper ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json, sys

    year     = int(sys.argv[1])     if len(sys.argv) > 1 else 2025
    province = sys.argv[2].upper()  if len(sys.argv) > 2 else "ON"
    token    = sys.argv[3]          if len(sys.argv) > 3 else AUTH_TOKEN

    print(f"Fetching dynamic values for {year} / {province} from {BASE_URL} ...")
    try:
        dv = fetch_dv(year, province, token=token)
        print(f"Got {len(dv)} entries:\n")
        print(json.dumps(dv, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
