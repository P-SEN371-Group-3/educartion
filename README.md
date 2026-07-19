# Educartion

## Introduction

## Docker Build Instructions

Use Compose from the repo root. These commands build and start everything:

   `docker compose build`
   `docker compose up -d`

  To rebuild a single service:

   `docker compose build api`
   `docker compose build frontend`
   `docker compose build postgres`

  To stop:

   `docker compose down`

  If you need a full rebuild without cache:

   `docker compose build --no-cache`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## File Structure

## Ongoing Team To-do List
### Due Sat 30 May (M4)

##### Data
- [x] 0. Database Dummy Data

##### Backend
- [ ] Finish api endpoints
    - [ ] Auth
        - HTTPS or still on http?
    - [ ] Catalog
    - [x] Cart
    - [ ] Orders
    - [x] Payments
    - [ ] Shipment
    - [ ] Admin
- [x] Unit Tests
    - [x] 0. Catalog Unit Tests + small testing to ensure products working


##### Frontend
- [x] 0. High Fidelity Wireframes + Prototype
- [x] 1. Refactor existing front end
    - [x] Check recording in case there's something missed
    - [ ] Front End Switching between Light and Dark Themes
    - [x] Resize the blocks (+ image) on products
    - [x] Fix delete button overlaying price on cart page
    - [ ] Move categories to the left
    - [ ] Slider needs to be added (check other filters as well on products page)

- [x] 2. Link pages together
    - [x] Set start page to products page (currently goes to login page)
    - [x] Link pages together in logical order
    - [ ] ~~Check Navbar links and make sure they work~~
    - [ ] ~~Add links to the footer as well~~

- [ ] 3. Check functionality on each page, if working then this can be ticked:
    - [ ] Products page
    - [ ] Product details page
        - [x] Add product button does not appear to do anything, but it does actually
    - [ ] Cart page
    - [ ] Checkout page
    - [ ] Orders page
    - [ ] Admin page
    - [ ] Login page
    - [ ] Register page
    - [ ] Payments page
    - [ ] Order Details & Shipment page?

### Due Fri 5 June (M5)

- [x] Confirm Backend Unit Tests are done
- [x] Frontend Unit Tests
- [ ] ~~Whatever is added in class (30 May)~~

### Due Sat 24 July (M6)

- [ ] HTTPS Certificates and ListenAndServe -> ListenAndServeTLS for HTTPS instead of HTTP - TODO for M6
- [ ] Render Deployment
- [ ] Finalise documentation
    - [ ] Fix up big document
        - [ ] Regen ERD

    - [ ] README.md files
        - [ ] Main
        - [ ] Backend
        - [ ] Frontend
        - [ ] Data
- [ ] Add Electron wrap-around for desktop app as additional requirements
- [ ] Presentation
- [ ] Record Video
