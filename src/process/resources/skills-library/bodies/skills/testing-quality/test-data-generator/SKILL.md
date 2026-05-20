---
name: test-data-generator
description: |
  Test data generation expertise covering Faker libraries across languages, factory patterns (Factory Boy, Fishery), seed data management, data anonymization techniques, synthetic data generation, constraint satisfaction, maintaining data relationships, database seeding strategies, and snapshot testing for data validation.
  Use when the user asks about test data generator, test data generator best practices, or needs guidance on test data generator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices guide"
  category: "testing-quality"
  subcategory: "test-automation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Test Data Generator

## Core Philosophy

Good tests require good data. Test data should be realistic enough to catch real bugs, minimal enough to keep tests fast and readable, and deterministic enough to make failures reproducible. The goal is to eliminate the "test data problem" -- the hours spent manually crafting data that exercises all code paths.

## Faker Libraries

### Python: Faker

```python
from faker import Faker
import random

fake = Faker()
Faker.seed(42)  # Deterministic output for reproducibility

# Basic generators
name = fake.name()                      # "John Smith"
email = fake.email()                    # "john.smith@example.com"
address = fake.address()                # "123 Main St\nPortland, OR 97201"
phone = fake.phone_number()             # "(503) 555-0123"
text = fake.text(max_nb_chars=200)      # Lorem ipsum paragraph
date = fake.date_between('-1y', 'today')  # Random date in last year
uuid = fake.uuid4()                     # UUID4 string
url = fake.url()                        # "[reference URL]"
ip = fake.ipv4()                        # "192.168.1.100"

# Domain-specific generators
credit_card = fake.credit_card_number() # "4111111111111111"
company = fake.company()                # "Smith & Associates"
job = fake.job()                        # "Software Engineer"
ssn = fake.ssn()                        # "123-45-6789"
# ... (condensed) ...
        return self.random_element(self.categories)

    def product_price(self, min_price=0.99, max_price=999.99):
        return round(random.uniform(min_price, max_price), 2)

fake.add_provider(EcommerceProvider)
fake.product_name()      # "Premium Widget"
fake.product_price()     # 42.99
```

### JavaScript: @faker-js/faker

```javascript
import { faker } from '@faker-js/faker';

faker.seed(42);  // Deterministic output

// Generate a complete user object
function generateUser(supersedes = {}) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
        id: faker.string.uuid(),
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }),
        avatar: faker.image.avatar(),
        phone: faker.phone.number(),
        address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            zip: faker.location.zipCode(),
            country: 'US',
        # ... (condensed) ...
// Bulk generation
const users = Array.from({ length: 100 }, () => generateUser());
const orders = users.flatMap(user =>
    Array.from(
        { length: faker.number.int({ min: 0, max: 10 }) },
        () => generateOrder(user.id)
    )
);
```

## Factory Patterns

### Python: Factory Boy

```python
import factory
from factory import fuzzy
from datetime import datetime, timezone, timedelta
from myapp.models import User, Order, OrderItem, Product

class UserFactory(factory.Factory):
    class Meta:
        model = User

    id = factory.Sequence(lambda n: n + 1)
    name = factory.Faker('name')
    email = factory.LazyAttribute(
        lambda o: f"{o.name.lower().replace(' ', '.')}@test.com"
    )
    tier = factory.Iterator(['free', 'basic', 'premium'])
    is_active = True
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))

    class Params:
        # Traits for common variations
        inactive = factory.Trait(
            is_active=False,
            # ... (condensed) ...
    order = OrderFactory(user=user, total=200.00)
    discount = calculate_discount(order)
    assert discount == 30.00  # 15% for premium

def test_inactive_user_cannot_order():
    user = UserFactory(inactive=True)
    with pytest.raises(InactiveUserError):
        create_order(user, items=[ProductFactory()])
```

### JavaScript: Fishery

```typescript
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

// Define factories
const userFactory = Factory.define<User>(({ sequence, params, transientParams }) => ({
    id: sequence,
    name: faker.person.fullName(),
    email: params.email || faker.internet.email(),
    role: params.role || 'user',
    isActive: true,
    createdAt: faker.date.past(),
}));

const productFactory = Factory.define<Product>(({ sequence }) => ({
    id: `prod_${sequence}`,
    name: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
    category: faker.helpers.arrayElement(['electronics', 'clothing', 'home']),
    stock: faker.number.int({ min: 0, max: 1000 }),
}));

const orderFactory = Factory.define<Order>(({ sequence, associations }) => {
    # ... (condensed) ...

// Usage
const user = userFactory.build({ role: 'admin' });
const premiumUser = userFactory.build({ role: 'premium' });
const products = productFactory.buildList(5);
const order = orderFactory.build({}, {
    associations: { user: premiumUser }
});
```

## Seed Data Management

### Database Seeding Script

```python
# seeds/seed_database.py
import json
from pathlib import Path

class DatabaseSeeder:
    def __init__(self, db_session):
        self.db = db_session

    def seed_all(self):
        """Seed all reference and test data in dependency order."""
        self.seed_categories()
        self.seed_products()
        self.seed_users()
        self.seed_orders()
        self.db.commit()

    def seed_categories(self):
        categories = [
            Category(id=1, name="Electronics", slug="electronics"),
            Category(id=2, name="Clothing", slug="clothing"),
            Category(id=3, name="Home & Garden", slug="home-garden"),
            Category(id=4, name="Books", slug="books"),
        # ... (condensed) ...
                order = OrderFactory(
                    user=user,
                    items=[
                        OrderItemFactory(product=random.choice(products))
                        for _ in range(random.randint(1, 3))
                    ]
                )
                self.db.add(order)
```

## Data Anonymization

```python
class DataAnonymizer:
    """Anonymize production data for use in testing/staging."""

    def __init__(self):
        self.fake = Faker()
        Faker.seed(0)
        self._email_map = {}  # Consistent mapping for referential integrity

    def anonymize_user(self, user: dict) -> dict:
        # Deterministic anonymization based on original value
        original_email = user['email']
        if original_email not in self._email_map:
            self._email_map[original_email] = self.fake.email()

        return {
            **user,
            'name': self.fake.name(),
            'email': self._email_map[original_email],
            'phone': self.fake.phone_number(),
            'ssn': None,  # Remove sensitive fields entirely
            'address': {
                'street': self.fake.street_address(),
                # ... (condensed) ...
        shift_days = hash(date_str) % 365
        return (dt + timedelta(days=shift_days)).isoformat()

# Usage
anonymizer = DataAnonymizer()
production_users = load_production_export('users.json')
anonymized = [anonymizer.anonymize_user(u) for u in production_users]
save_to_file('seeds/anonymized_users.json', anonymized)
```

## Constraint Satisfaction

### Generating Valid Related Data

```python
class ConstrainedDataGenerator:
    """Generate data that satisfies business rules and foreign key constraints."""

    def generate_valid_order(self) -> Order:
        """Order must have: valid user, in-stock products, correct totals."""
        user = UserFactory(is_active=True)

        # Products must have sufficient stock
        products = [
            ProductFactory(stock=fuzzy.FuzzyInteger(10, 100).fuzz())
            for _ in range(random.randint(1, 4))
        ]

        items = []
        for product in products:
            quantity = random.randint(1, min(5, product.stock))
            items.append(OrderItem(
                product_id=product.id,
                quantity=quantity,
                unit_price=product.price
            ))

        # ... (condensed) ...
        for _ in range(random.randint(5, 50)):
            cursor += timedelta(hours=random.randint(1, 72))
            if cursor > now:
                break
            event_type = random.choice(['login', 'view_product', 'add_to_cart', 'purchase'])
            events.append(Event(user_id=user_id, type=event_type, timestamp=cursor))

        return events
```

## Snapshot Testing

```python
# pytest with snapshot testing (syrupy)
def test_user_serialization(snapshot):
    user = UserFactory(
        name="Alice Smith",
        email="alice@example.com",
        tier="premium",
        created_at=datetime(2025, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
    )
    result = UserSerializer().serialize(user)
    assert result == snapshot

# First run: creates snapshot file
# Subsequent runs: compares against snapshot
# Update snapshots: pytest --snapshot-update
```

```javascript
// Jest snapshot testing
test('user API response matches snapshot', () => {
    const user = userFactory.build({
        name: 'Alice Smith',
        email: 'alice@example.com',
    });
    const serialized = serializeUser(user);
    expect(serialized).toMatchSnapshot();
});

// Inline snapshot
test('error message format', () => {
    const error = validateEmail('not-an-email');
    expect(error).toMatchInlineSnapshot(`"Invalid email format: not-an-email"`);
});
```

## Best Practices

1. **Always seed Faker for reproducibility**: Same seed produces same data across runs
2. **Use factories over raw constructors**: Factories express intent and handle defaults
3. **Generate minimal data**: Only create what the test needs
4. **Use traits for variations**: `UserFactory(premium=True)` over manual field setting
5. **Keep seed data in version control**: JSON/YAML files alongside code
6. **Anonymize production data carefully**: Preserve relationships and data distributions
7. **Validate generated data**: Run business rule validation on generated datasets
8. **Document test accounts**: Known credentials for E2E testing in a secure location

## When to Use

**Use this skill when:**
- Designing or implementing test data generator solutions
- Reviewing or improving existing test data generator approaches
- Making architectural or implementation decisions about test data generator
- Learning test data generator patterns and best practices
- Troubleshooting test data generator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Test Data Generator Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement test data generator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended test data generator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When test data generator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
