# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e4]:
      - link "VittaMed" [ref=e5] [cursor=pointer]:
        - /url: /
        - img [ref=e7] [cursor=pointer]
        - generic [ref=e9] [cursor=pointer]: VittaMed
      - generic [ref=e10]:
        - link "Iniciar Sesión" [ref=e11] [cursor=pointer]:
          - /url: /auth/login
        - link "Registrarse" [ref=e12] [cursor=pointer]:
          - /url: /auth/register-business
  - generic [ref=e13]:
    - generic [ref=e14]:
      - heading "Iniciar Sesión en VittaMed" [level=2] [ref=e15]
      - paragraph [ref=e16]:
        - text: ¿No tienes cuenta?
        - link "Regístrate aquí" [ref=e17] [cursor=pointer]:
          - /url: /auth/register-business
    - generic [ref=e20]:
      - generic [ref=e21]: Email o contraseña incorrectos
      - generic [ref=e22]:
        - generic [ref=e23]: Email
        - textbox "Email" [ref=e25]: patient@example.com
      - generic [ref=e26]:
        - generic [ref=e27]: Contraseña
        - textbox "Contraseña" [ref=e29]: password
      - button "Iniciar Sesión" [ref=e31] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e37] [cursor=pointer]:
    - img [ref=e38] [cursor=pointer]
  - alert [ref=e41]
```