---
name: gift-finder
description: |
  Gift recommendation engine with suggestions by relationship, occasion, budget, and interests, plus experience gift ideas, DIY options, group gift coordination, gift registry creation, wrapping ideas, and card message templates.
  Use when the user asks about gift finder, or needs help with gift recommendation engine with suggestions by relationship, occasion, budget, and interests, plus experience gift ideas, diy options, group gift coordination, gift registry creation, wrapping ideas, and card message templates.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of gift finder.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "relationships personal-communication checklist"
  category: "family-relationships"
  subcategory: "relationships-communication"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Gift Finder

## When to Use

**Use this skill when:**
- User asks about gift finder
- User needs guidance on gift finder topics
- User wants a structured approach to gift finder

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Overview

This skill helps users find thoughtful, personalized gifts for any occasion, relationship, and budget. Moving beyond generic gift guides, this engine uses a structured profiling approach to match gifts to the recipient's personality, interests, and love language. It also covers experience gifts, DIY options, group gifting, and the often-skipped art of card messages.

## Questions to Ask the User First

1. **Who is the gift for?** (Relationship: partner, parent, child, friend, coworker, boss, teacher, etc.)
2. **What's the occasion?** (Birthday, holiday, wedding, baby shower, thank you, "just because", etc.)
3. **Budget?** (Under $25, $25-50, $50-100, $100-250, $250+, flexible)
4. **What are their interests/hobbies?** (The more specific, the better)
5. **How old are they?** (Approximate age or age range)
6. **What have you given them before?** (Avoid repeats, build on what worked)
7. **What's their love language?** (Gifts, quality time, acts of service, words, touch)
8. **Any constraints?** (Shipping time, allergies, dietary restrictions, cultural considerations)
9. **Material gift or experience?** (Or open to both?)
10. **Do they have a wishlist?** (Amazon, registry, hints they've dropped)
11. **Are others going in on this gift?** (Solo or group?)

## Gift Selection Framework

### Recipient Profiling

```
GIFT PROFILE TEMPLATE:

Recipient: _______________
Relationship: _______________
Age: _______________
Occasion: _______________
Budget: $_______________

INTERESTS & HOBBIES:
  Primary hobby: _______________
  Other interests: _______________
  What they talk about most: _______________
  What they spend free time doing: _______________

PERSONALITY:
  [ ] Practical (values function, usefulness)
  [ ] Sentimental (values meaning, memories)
  [ ] Adventurous (values new experiences)
  [ ] Creative (values unique, artistic items)
  [ ] Luxurious (values quality, indulgence)
  [ ] Minimalist (values simplicity, clutter-free)
  [ ] Tech-forward (values gadgets, innovation)
  [ ] Homebody (values comfort, cozy items)

LOVE LANGUAGE (Gary Chapman):
  [ ] Gifts (the thought and selection matter most)
  [ ] Quality Time (experience together > material item)
  [ ] Acts of Service (doing something for them > buying something)
  [ ] Words of Affirmation (a meaningful card may matter more than the gift)
  [ ] Physical Touch (cozy/comfort items, couple experiences)

LIFESTYLE:
  Living situation: _______________
  Do they have kids/pets: _______________
  Any health considerations: _______________
  What they'd never buy themselves: _______________

ANTI-PROFILE (equally important):
  They don't like: _______________
  They have too many of: _______________
  Previous gifts that missed: _______________
  Things they'd never use: _______________
```

### The Gift Hierarchy

```
GIFT THOUGHTFULNESS SPECTRUM:

LEVEL 1: GENERIC (functional but impersonal)
  Gift card, candle set, generic basket
  When appropriate: Secret Santa, acquaintances, when you truly don't
  know them well. No shame in this -- it's honest.

LEVEL 2: INTEREST-BASED (shows you know them a little)
  Something related to their hobby, a book on a topic they mentioned
  When appropriate: Friends, coworkers, extended family

LEVEL 3: PERSONALIZED (shows you pay attention)
  Custom item with their name/initials, engraved, monogrammed
  Their favorite brand/thing in an upgraded version
  When appropriate: Close friends, family, partners

LEVEL 4: MEANINGFUL (shows deep understanding)
  Something that references a shared memory, inside joke, or
  specific conversation. An item that solves a problem they
  mentioned once in passing.
  When appropriate: Closest relationships, milestone occasions

LEVEL 5: EXPERIENTIAL (creates a new memory together)
  A planned experience tailored to them, time spent together,
  an adventure designed around their dreams
  When appropriate: Partners, best friends, parents, children
```

## Gift Ideas by Relationship

### For Partners

```
PARTNER GIFT IDEAS:

UNDER $25:
  - A handwritten love letter (surprisingly powerful)
  - A playlist of songs that remind you of them (with explanations)
  - Their favorite treat from a specialty store
  - A book by their favorite author (signed if possible)
  - Photo printed and framed from a meaningful moment
  - Subscription to something they enjoy (1 month trial)

$25-50:
  - Custom illustration of your home, pet, or couple
  - Quality version of something they use daily (nice pen, mug, wallet)
  - Concert or event tickets
  - Cooking class or wine tasting for two
  - Custom phone case with meaningful photo
  - Luxury version of their favorite snack/drink (gourmet coffee, chocolate box)

$50-100:
  - Weekend experience (spa day, wine tour, adventure activity)
  - Personalized jewelry (coordinates, initials, birthstone)
  - Subscription box for their hobby (3+ months)
  - Weighted blanket or luxury bedding
  - Smart home device they've mentioned wanting
  - Customized book (Lovebook, StoryWorth questions for parents)

$100-250:
  - Planned surprise date (transportation, activity, dinner, all arranged)
  - High-quality hobby equipment/upgrade
  - Weekend getaway (even a nearby Airbnb counts)
  - Technology upgrade they won't buy themselves
  - Commissioned artwork of something meaningful to them

$250+:
  - Travel experience (flights, hotel, itinerary planned)
  - Major hobby investment (camera, instrument, equipment)
  - Milestone jewelry
  - "Year of experiences" (12 envelopes, one per month, each with a planned date)
```

### For Parents

```
PARENT GIFT IDEAS:

UNDER $25:
  - Framed photo of grandchildren (or family, updated annually)
  - Recipe book of family recipes (handwritten or printed)
  - Personalized calendar with family photos
  - A heartfelt letter of appreciation
  - Audiobook subscription
  - Their favorite tea or coffee with a nice mug

$25-100:
  - Digital photo frame (preloaded with photos -- they never have to do anything)
  - Subscription: meal kit, streaming, book club
  - Quality comfort items (blanket, slippers, robe)
  - Family tree artwork or ancestry subscription
  - Experience: cooking class, garden tour, museum membership
  - Upgraded version of something they use daily but won't replace

$100+:
  - StoryWorth subscription (weekly prompts, printed into a book)
  - Technology to stay connected (tablet set up for video calls)
  - Experience together: trip, show, concert, sporting event
  - Home improvement they've needed but won't do for themselves
  - Professional family photo session
  - Spa day or wellness experience
```

### For Coworkers and Bosses

```
WORKPLACE GIFT IDEAS:

COWORKER ($10-25):
  - Quality desk plant (low maintenance: pothos, succulent)
  - Nice notebook or planner
  - Specialty coffee or tea sampler
  - Gift card to local coffee shop or lunch spot
  - Desk organization accessory
  - Treats from a local bakery

BOSS ($25-50):
  - Quality pen or desk accessory
  - Specialty food basket (wine if appropriate, gourmet snacks)
  - Donation to a charity in their name (research their interests)
  - Experience: gift card to nice restaurant
  - Book related to a professional interest
  Note: Keep it professional, not too personal

GROUP GIFT FOR DEPARTING COLLEAGUE:
  - Memory book with messages from the team
  - Gift card to their favorite store/restaurant
  - Group contribution toward a meaningful experience
  - Customized item related to inside jokes or shared memories
```

## Experience Gifts

```
EXPERIENCE GIFT IDEAS:

ADVENTURE:
  - Skydiving, bungee jumping, zip-lining
  - Hot air balloon ride
  - Helicopter tour
  - White water rafting
  - Rock climbing gym membership

FOOD & DRINK:
  - Cooking class (specific cuisine)
  - Wine or whiskey tasting
  - Food tour of local neighborhood
  - Farm-to-table dinner experience
  - Chocolate or cheese making class

CREATIVE:
  - Pottery/ceramics class
  - Painting night (Bob Ross style)
  - Glassblowing or metalworking workshop
  - Photography class or walk
  - Music lesson or recording studio experience

WELLNESS:
  - Spa day (massage, facial, whole package)
  - Float tank session
  - Yoga or meditation retreat
  - Personal training sessions
  - Sound bath experience

LEARNING:
  - MasterClass subscription
  - Museum/zoo/aquarium annual membership
  - Language learning subscription
  - Local workshop (woodworking, sewing, coding)
  - Guided nature walk or birdwatching excursion

TOGETHER EXPERIENCES (for couples/friends):
  - Escape room
  - Comedy show
  - Couples' massage
  - Trivia night reservation
  - Dance class (salsa, swing, ballroom)
  - Stargazing with telescope rental
  - Scenic drive with planned stops

WRAPPING EXPERIENCE GIFTS:
  - Print a voucher or card describing the experience
  - Include a small related prop (cooking class: a wooden spoon)
  - Put the voucher in a creative container
  - Include a date: "On [date], we're going to..."
```

## DIY Gift Ideas

```
DIY GIFT IDEAS BY SKILL LEVEL:

BEGINNER (no special skills needed):
  - Photo book (online service: Shutterfly, Chatbooks)
  - Memory jar (365 notes, one for each day)
  - Curated care package (themed: movie night, spa day, hangover kit)
  - Mix CD/playlist with handwritten liner notes explaining each song
  - Coupon book (homemade: favors, experiences, help)
  - Infused olive oil or flavored salt
  - Hot sauce or spice blend
  - Decorated picture frame with photo

INTERMEDIATE (some craft ability):
  - Hand-knit scarf or hat
  - Homemade candles (soy wax, custom scents)
  - Embroidered item (handkerchief, tote bag)
  - Woodburned cutting board or coaster set
  - Hand-poured bath bombs or soaps
  - Painted flower pot with planted herb
  - Custom cross-stitch or needlework

ADVANCED (real craft skills):
  - Quilted blanket
  - Woodworked item (cutting board, shelf, jewelry box)
  - Hand-thrown pottery
  - Leather journal or wallet
  - Stained glass piece
  - Illustrated portrait or artwork

DIY FOOD GIFTS:
  - Homemade jam or preserves with custom labels
  - Cookie or baking mix in a jar (layered ingredients, attach recipe)
  - Infused vodka or liqueur
  - Gourmet popcorn in decorated bags
  - Custom spice blend with label and recipe cards
  - Holiday bark or truffles in a gift box
```

## Group Gift Coordination

```
GROUP GIFT COORDINATION PLAN:

ORGANIZER TEMPLATE:

Gift Recipient: _______________
Occasion: _______________
Gift Idea: _______________
Total Budget: $_______________

CONTRIBUTORS:
  Name: _____________ Amount: $____ Collected: [ ]
  Name: _____________ Amount: $____ Collected: [ ]
  Name: _____________ Amount: $____ Collected: [ ]
  Name: _____________ Amount: $____ Collected: [ ]

LOGISTICS:
  Money collection method: [ ] Venmo [ ] Cash [ ] Other: ___
  Purchase deadline: _______________
  Who's purchasing: _______________
  Card: [ ] Group signed [ ] Individual messages compiled
  Wrapping: Who's responsible: _______________
  Delivery: _______________

COMMUNICATION:
  Send initial message to group: "We're collecting for [name]'s
  [occasion]. Suggested contribution: $[amount] per person.
  Please send to [method] by [date]."

  Follow-up reminder: [date]
  Final "thank you" to contributors: [date]

TIPS:
  - Give a suggested amount, not a required amount
  - Some people can give more, some less -- that's okay
  - Use Venmo/Splitwise for easy collection
  - Keep the recipient out of group chats about the gift
  - Have a backup plan if contributions fall short
```

## Card Message Templates

### By Occasion

```
BIRTHDAY MESSAGES:

Casual friend:
  "Happy birthday, [name]! Wishing you a day as wonderful as you are.
   Cheers to another great year."

Close friend:
  "Happy birthday to someone who makes everything more fun.
   I'm so grateful to have you in my life. Here's to [age]
   being your best year yet. Love, [your name]"

Partner:
  "Happy birthday to my favorite person. Every day with you is a gift.
   I love who you are and who you're becoming. Here's to celebrating you
   today and every day. All my love, [your name]"

Parent:
  "Happy birthday, [Mom/Dad]. Thank you for everything you've done and
   continue to do for our family. I hope this year brings you as much
   joy as you bring everyone around you. Love, [your name]"

Child:
  "Happy [#] birthday, [name]! Watching you grow is the greatest
   adventure. You make us so proud just by being you. Here's to a year
   full of [their interest] and lots of fun. Love, [Mom/Dad]"

Colleague:
  "Happy birthday, [name]! Wishing you a great day and a wonderful year
   ahead. The team is lucky to have you."

HOLIDAY MESSAGES:
  Warm: "Wishing you a wonderful holiday season filled with warmth,
         laughter, and the people you love most."
  Professional: "Season's greetings from our family to yours.
                 Wishing you health and happiness in the new year."
  Personal: "May this holiday season bring you everything your heart
             desires. Thank you for being such a special part of our year."

THANK YOU MESSAGES: (See Thank You Writer skill for comprehensive templates)

SYMPATHY MESSAGES:
  "I'm so sorry for your loss. [Name] was a wonderful person, and
   I feel honored to have known them. There are no words that can
   make this easier, but please know that I'm here for you in
   whatever way you need. With deepest sympathy, [your name]"
```

## Last-Minute Gift Options

```
LAST-MINUTE GIFTS (same day or next day):

DIGITAL (instant):
  - E-gift card to their favorite store ($any)
  - Streaming subscription (Netflix, Spotify, Audible)
  - Online class enrollment (MasterClass, Skillshare)
  - Donation to a cause they care about (in their name)
  - Digital photo album (Google Photos, shared album)

EXPERIENCE (print a voucher):
  - "I owe you" coupon for a planned experience
  - Massage or spa gift certificate (many sell online instantly)
  - Restaurant gift card + "dinner is on me this Saturday"
  - Event tickets (check tonight's or this weekend's options)

PICK UP TODAY:
  - Flowers (grocery store bouquet can be beautiful)
  - Bottle of wine/spirits with a handwritten note
  - Bakery treats
  - Book from the bookstore
  - Candle, chocolates, nice pen (grab from home goods store)

THE "RESCUE" KIT:
  When you skipped entirely and need something in 30 minutes:
  1. Buy a nice card and write a meaningful, specific message (this matters most)
  2. Add a gift card to their favorite place
  3. Or: print a "voucher" for a planned experience
  The card message is the real gift. Put your heart into it.
```

## Gift Wrapping and Presentation

```
WRAPPING APPROACHES:

CLASSIC:
  - Quality wrapping paper, ribbon, and gift tag
  - Use double-sided tape for clean lines
  - Add a sprig of greenery, dried flower, or cinnamon stick

SUSTAINABLE:
  - Fabric wrapping (furoshiki -- Japanese cloth wrapping)
  - Newspaper (comics section is charming)
  - Brown kraft paper with stamps, drawings, or stickers
  - Reusable gift bags
  - The gift inside a useful container (basket, mug, tote bag)

CREATIVE:
  - Themed wrapping (wrap cooking gifts in a dish towel, etc.)
  - Progressive unwrapping (gift inside box inside box)
  - Scavenger hunt leading to the gift
  - Map leading to where the gift is hidden
  - Puzzle box or creative opening mechanism
```

## Output Format

When recommending gifts:

```
GIFT RECOMMENDATIONS

Recipient: [name], [relationship]
Occasion: [occasion]
Budget: $[range]
Personality type: [from profile]

TOP RECOMMENDATIONS:

  1. [Gift name]
     Price: $[range]
     Where to buy: [store/website]
     Why this works: [personalized reason]
     Presentation idea: [how to give it]

  2. [Gift name]
     Price: $[range]
     Where to buy: [store/website]
     Why this works: [personalized reason]

  3. [Gift name]
     Price: $[range]
     Where to buy: [store/website]
     Why this works: [personalized reason]

DIY ALTERNATIVE:
  [Handmade option related to their interests]

EXPERIENCE ALTERNATIVE:
  [Experience gift option]

CARD MESSAGE:
  "[Suggested card message personalized to the occasion and relationship]"
```

## Example

**Input:** "Help me get started with gift finder"

**Output:** A structured gift finder plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
