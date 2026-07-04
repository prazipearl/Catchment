# Catchment

A web app that helps homeowners assess rooftop rainwater harvesting potential for their specific roof, and connects them with local vendors who can install the recommended system.

Built in response to Smart India Hackathon problem statement **SIH25065** (Ministry of Jal Shakti) — on-spot assessment of Rooftop Rainwater Harvesting (RTRWH) and Artificial Recharge potential.

## The problem

Rooftop rainwater harvesting is legally mandated in many Indian states, but most people have no way to know how much rainwater their roof can actually collect, what size storage/recharge structure they need, or who can install it — without hiring an expensive civil engineer.

## Features

- **Rainfall calculator** — enter your roof area and click your location on a map to get a harvesting potential estimate, based on real historical rainfall data
- **Water allocation breakdown** — see a suggested split of your harvested water across groundwater recharge, irrigation, and indoor use
- **Assessment history** — past calculations are saved and retrievable

## Tech stack

- Frontend: React (Vite) + Tailwind CSS + Leaflet
- Backend: Node.js + Express
- Database: PostgreSQL (via Supabase) + Prisma ORM
- Rainfall data: Open-Meteo Historical Weather API

## Running locally

### Backend