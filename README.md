# eventpop-ticket-gateway

A gateway that lets Eventpop ticket holders authenticate themselves.

This gateway is built for [Creatorsgarten](https://creatorsgarten.org/) team,
who organizes many events that covers multiple themes, organized by different
people, but under the same umbrella.

This gateway provides a way for developers to provide a "Authenticate using
Eventpop Ticket" experience without needing to implement the whole OAuth2 flow.

The ticket gateway uses RSA signatures to sign the ID token, so consumers
can verify the authenticity of the token without having to share `client_secret`,
`access_token`, or any other secret. Just use the public key [(below)][pk] to
verify the JWT.

[pk]: #3-extract-and-validate-the-id-token

## Why

Eventpop’s API has **User Authentication Flow**. However, a user can have
multiple tickets for multiple events.

Usually, when integrating with Eventpop, I find that most of the time I care
about a single ticket for a single event. That means each time I integrate with
Eventpop I have to implement the following logic:

1. If user doesn’t have a ticket for the current event, they cannot continue.
2. If user has multiple tickets for the current event, let them pick which one
   to use.

This repository implements the so-called **Ticket Authentication Flow** which
takes care of the above requirements. Once user has authenticated and selected a
ticket, we (the Ticket Gateway) send the user back to the application along with
a [JWT ID token](https://auth0.com/docs/tokens/id-tokens) signed with an RS256
private key. The system can verify the validity of the ID token by checking it
against the [public key][pk].

## Plan

![](http://www.plantuml.com/plantuml/svg/bP91JyCm38Nl_HLMkO04hRG34fF6Dc0Wxd168RMQg5bS9HxL-FKqwIWRb4wxv61_UTRpyyApSBnPc-JLeuEhMrZMjT5Ii2OBKp1KQflirG8IqIcK14pmecM534-2iH7RNYOzhASjdpiij4F9cUArcUC7MdukPZVNaqdo1_yzPXNeckf-m7SX29FOiCh3Gqv_OjBtVbJwvdn8OOj-w5D15Y-XTkZR5h3I7b991QOd6fV2c7SXgyvuK9XbMJPaUi0MKuKswUl38uIKwFrRP8_fbiWTuCzt6LmSa-UE7uj9AYAFq2WjrOuFM_AwjA0jD9hLs8wMT_SFgyUn0OSnHASn1rQuVxJ_77BUBlmiVeghNw0jsgl_0W00)

## How to integrate

### 1. Redirect user to ticket gateway

Construct a URL to the ticket gateway’s `redirect.html` with the following query params:

- `eventId` Eventpop event ID.
- `target` The target URL to redirect to. Should contain an `%s` in it.

Example:

```js
const url = 'https://eventpop-ticket-gateway.vercel.app/redirect.html?' + new URLSearchParams({
  eventId: '13089',
  target: 'https://httpbin.org/anything?id_token=%s'
})
console.log(url)
```

Generates the following URL:

> <https://eventpop-ticket-gateway.vercel.app/redirect.html?eventId=13089&target=https%3A%2F%2Fhttpbin.org%2Fanything%3Fid_token%3D%25s>

### 2. User logs in with Eventpop and selects a ticket

![image](https://user-images.githubusercontent.com/193136/178738038-a490777c-71f9-41ab-8a57-d64294bf56e5.png)

After user select ticket, they will be redirected to the URL specified in `target` param. The `%s` will be replaced by the **ID token**.

### 3. Extract and validate the ID token

Extract the ID token from the URL. Here is an example ID token:

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWNrZXRJZCI6NDc4MDU2OSwiZXZlbnRJZCI6MTMwODksImZpcnN0bmFtZSI6IlRoYWkiLCJsYXN0bmFtZSI6IlBhbmdzYWt1bHlhbm9udCIsImVtYWlsIjoiW3JlZGFjdGVkXUBnbWFpbC5jb20iLCJyZWZlcmVuY2VDb2RlIjoiUkVEQUNUIiwidGlja2V0VHlwZSI6IuC4muC4seC4leC4o-C5gOC4guC4ouC5iOC4hyIsInRhcmdldCI6Imh0dHBzOi8vaHR0cGJpbi5vcmcvYW55dGhpbmc_aWRfdG9rZW49JXMiLCJpYXQiOjE2NTc3MTY2ODksImV4cCI6MTY1Nzc1MjY4OX0.RDPOgFg8XTs2JkcfVEF6p8_8dWBSGN73dC3i0JyZM6fXtDukurKHff3T3mWYkdLZbt3wDt760IcynyhQhEVLxhjVzczmwRvFU5BH0c87XIwF18tpRXH8PbNG9XgNduP6MhoLNIxXcrQWMDcj4QDiC0BfTyd4EZNdAwolAYzytxyjMYskBb3w61y8u4ncQ2xdipfbbwx8zAYMcs_1IvryJWITIM5Fi7HmTI_oldt93lNgBA5mQ1cKpHSj0jqkq67rVMirFrDrmhmTHX7OKALBHZwk734hNqMrZIWIdjYBLZ-fP_ctDYwwOo5e5qbTw9Hq--mKlDA-uqS75GDX0_kQ2Q
```

Verify its signature using the following public key:

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8GO2/OpcRMCJ150DyObi
QkN54M1ACoDN+CyRzCuY4o3yFPYfIFnhwTFX622SIDrqv9HDoIKwT1XitIsToyBH
sSfET/iukcHhqjQnowdQAvxmgK4gSDxipHcbBd1c2Qfjwfkfj4X3CfR9ronA1HYe
2vICBpwcyiJTyicljuyq1kvFWG7S24iugh0DJ9wuHo/rF3gmWlU9/5TTMKR+GLxI
nRAFIpN5DfdVYbj6foLelq2r8KdMtQZzzt6nBR7RcraPSuidHWKkYR8KJrTmZn4z
JW6iZD9S9gdyfRQZMXu1TMYq7B9D25EE8lceY/c5KSVSvKcrvIcqTJu02T+iOrat
swIDAQAB
-----END PUBLIC KEY-----
```

Then, when decoded, you will find the following claims:

```json
{
  "ticketId": 4780569,
  "eventId": 13089,
  "firstname": "Thai",
  "lastname": "Pangsakulyanont",
  "email": "[redacted]@gmail.com",
  "referenceCode": "REDACT",
  "ticketType": "บัตรเขย่ง",
  "target": "https://httpbin.org/anything?id_token=%s",
  "iat": 1657716689,
  "exp": 1657752689
}
```

Perform these checks:

| Claim | Condition |
| ----- | --------- |
| `eventId` | Should match the event ID that you are integrating. |
| `ticketType` | Should be the name of the ticket type that you accept. Skip this check if you intend to a accept all ticket types. |
| `target` | Should match the target URL that you provided in step 1. |
| `exp` | Should be greater than the current Unix timestamp. |

