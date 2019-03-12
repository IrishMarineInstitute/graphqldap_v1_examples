# graphqldap-v1-examples
Examples of using the graphqldap api v1

```
docker build -t 127.0.0.1:5000/graphqldap-v1-examples .
docker push 127.0.0.1:5000/graphqldap-v1-examples
docker service create --name graphqldap-v1-examples --label traefik.port=80 --label traefik.domain=dm.marine.ie --network traefik-net 127.0.0.1:5000/graphqldap-v1-examples
```

