# Test Scripts

Scripts de testing y pruebas del proyecto.

## Test Files

- `test_abbeville.js` - Test para página de Abbeville
- `test_addr.js` - Test de verificación de direcciones
- `test_bbb.js` - Test de integración BBB
- `test_body.js` - Test de análisis de body HTML
- `test_bulk_delete.js` - Test de eliminación en lote
- `test_multiple_cities.js` - Test con múltiples ciudades
- `test_scrape.js` - Test de scraping

## Ejecutar Tests

```bash
# Ejecutar test individual
node scripts/tests/test_scrape.js

# Ejecutar todos los tests
for file in scripts/tests/test_*.js; do node "$file"; done
```

## Estado

⚠️ Scripts antiguos - considerar migrar a framework de testing moderno:
- Jest
- Vitest
- Playwright

## Próximos Pasos

- [ ] Migrar a Jest
- [ ] Crear test suite integrado
- [ ] CI/CD pipeline
