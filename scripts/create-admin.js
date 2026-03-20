// Script para crear usuario admin inicial
// Ejecutar con: curl -X POST https://bc-prod.enrique-mastalli.workers.dev/auth/users \
//   -H "Authorization: Bearer <ADMIN_API_KEY>" \
//   -H "Content-Type: application/json" \
//   -d '{"email":"admin@bc.local","password":"admin123456","role":"admin"}'

// O usar directamente desde aquí:
const ADMIN_API_KEY = "sk_bc_admin_prod_4a3c7c0ba1648e9708603afe3d40e8bd";
const API_URL = "https://bc-prod.enrique-mastalli.workers.dev";

async function createAdminUser() {
  const response = await fetch(`${API_URL}/auth/users`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ADMIN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@bc.local",
      password: "admin123456",
      role: "admin",
    }),
  });
  
  if (response.ok) {
    console.log("Usuario admin creado exitosamente");
    console.log("Email: admin@bc.local");
    console.log("Password: admin123456");
  } else {
    console.error("Error:", await response.text());
  }
}

createAdminUser();