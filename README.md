# graphqldap_v1_examples
Examples of using the graphqldap api v1

```docker build -t 127.0.0.1:5000/graphqldapv1demos .
docker push 127.0.0.1:5000/graphqldapv1demos
docker service create --name graphqldapv1demos --label traefik.port=80 --label traefik.domain=dm.marine.ie --network traefik-net 127.0.0.1:5000/graphqldapv1demos
```

