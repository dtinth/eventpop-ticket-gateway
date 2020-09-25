# eventpop-ticket-gateway

A gateway that lets Eventpop ticket holders authenticate themselves

## Plan

![](http://www.plantuml.com/plantuml/svg/bP91JyCm38Nl_HLMkO04hRG34fF6Dc0Wxd168RMQg5bS9HxL-FKqwIWRb4wxv61_UTRpyyApSBnPc-JLeuEhMrZMjT5Ii2OBKp1KQflirG8IqIcK14pmecM534-2iH7RNYOzhASjdpiij4F9cUArcUC7MdukPZVNaqdo1_yzPXNeckf-m7SX29FOiCh3Gqv_OjBtVbJwvdn8OOj-w5D15Y-XTkZR5h3I7b991QOd6fV2c7SXgyvuK9XbMJPaUi0MKuKswUl38uIKwFrRP8_fbiWTuCzt6LmSa-UE7uj9AYAFq2WjrOuFM_AwjA0jD9hLs8wMT_SFgyUn0OSnHASn1rQuVxJ_77BUBlmiVeghNw0jsgl_0W00)

## Initiate authentication

```
/redirect.html?eventId=9622
```

## After user select ticket, they will be redirected to application with

```
#token=${idToken}
```

The `idToken` is a JWT, signed with this key:

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

It contains these information:

- `email`
- `eventId`
- `firstname`
- `lastname`
- `referenceCode`
- `ticketType`
