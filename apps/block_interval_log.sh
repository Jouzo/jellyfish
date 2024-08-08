#!/bin/bash
# set -Eeuo pipefail

get_logs() {
    local port=3000

    local endpoints=(
        "blocks" "loans/schemes" "loans/collaterals" "loans/tokens" "loans/vaults"
        "loans/auctions" "masternodes" "oracles" "poolpairs" "poolpairs/dexprices"
        "prices" "tokens"
    )

    for endpoint in "${endpoints[@]}"; do
        echo "$endpoint"
        curl -s "http://127.0.0.1:$port/v0/mainnet/$endpoint"
        echo ""
    done
}

main () {
 get_logs
}

main
