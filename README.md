# Prober

Send HTTP probe to specific host and show connection message

## Environment

| Key | Default | Desc. |
| - | - | - |
| PROBER_HTTP_SCHEME | `http` | Should only be `http` or `https` |
| PROBER_HTTP_HOST | `localhost` | |
| PROBER_HTTP_PORT | `80` | `443` if scheme is https |
| PROBER_HTTP_PATH | `/` | |
| PROBER_HTTP_METHOD | `GET` | |
| PROBER_HTTP_HEADERS | `{"user-agent": "prober"}` | JSON format |
| PROBER_HTTP_TIMEOUT | `30` | seconds |
| PROBER_DNS_TTL | `300` | seconds, 0 will request DNS every time |
| PROBER_HTTP_BODY | | Default using GET without any body |
| PROBER_RESPONSE_IS_TIMING | `false` | if response is timing, it will log as `exec`  |
| PROBER_DURATION | `0` | How long will it run, `0` means always. |
| PROBER_RATE | `0` | How many requests per second, `0` means one single thread without considering rate. If rate is `0`, duration means how many request it will send |

## Log

All timing are milliseconds.

```jsonl
{"prober":{"id":"2b20fe24afc54fb762247a5c4f76817a0b9e87311eadbed9","action":"dns","timing":7}}
{"prober":{"id":"2b20fe24afc54fb762247a5c4f76817a0b9e87311eadbed9","action":"tcp","timing":14}}
{"prober":{"id":"2b20fe24afc54fb762247a5c4f76817a0b9e87311eadbed9","action":"tls","timing":22}}
{"prober":{"id":"2b20fe24afc54fb762247a5c4f76817a0b9e87311eadbed9","action":"response","timing":36}}
```

If set `RESPONSE_IS_TIMING` to true, it will show:

```jsonl
{"prober":{"id":"2b20fe24afc54fb762247a5c4f76817a0b9e87311eadbed9","action":"exec","timing":1}}
```

which will parse response body directly as number. This should be how long server execute this request
