#!/usr/bin/env bash
export LC_ALL=en_US.UTF-8
set -Eeuo pipefail

ENDPOINT=${ENDPOINT:-"localhost:3000/v0/mainnet"}


get_data() {
    curl -s "$ENDPOINT/stats"
    curl -s "$ENDPOINT/tokens"

    get_burn_address_data

    curl -s "$ENDPOINT/blocks"
    curl -s "$ENDPOINT/loans/schemes"
    curl -s "$ENDPOINT/loans/collateral"
    curl -s "$ENDPOINT/loans/tokens"
    curl -s "$ENDPOINT/masternodes"
    curl -s "$ENDPOINT/oracles"
    curl -s "$ENDPOINT/poolpairs"
    curl -s "$ENDPOINT/poolpairs/dexprices"
    curl -s "$ENDPOINT/prices"
}

get_burn_address_data() {
    local burn_address="8defichainBurnAddressXXXXXXXdRQkSm"
    local burn_endpoint="$ENDPOINT/address/$burn_address"

    curl -s "$burn_endpoint/history"
    curl -s "$burn_endpoint/balance"
    curl -s "$burn_endpoint/aggregation"
    curl -s "$burn_endpoint/tokens"
    curl -s "$burn_endpoint/vaults"
    curl -s "$burn_endpoint/transactions"
    curl -s "$burn_endpoint/transactions/unspent"
}

get_data
