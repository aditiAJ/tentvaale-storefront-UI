import type { Bundle, Collection, Product } from "./types";

const U = (id: string, w = 800) => `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=${w}`;

// Every product is tagged against mock-data/taxonomy.ts. Ids p1–p59 are the
// original catalog (saved plans/orders reference them); p60+ cover the
// festival and function-specific pieces (Sufi night, Haldi, Ganpati, Diwali)
// that the new bundles are built from. Photos are Unsplash stand-ins; products
// without one fall back to ProductThumb's placeholder icon.
export const PRODUCTS: Product[] = [
  // ───── Furniture ─────
  { id: "p18", name: "Gold Throne Chairs (Pair)", category: "Furniture", subcategory: "Thrones", rateType: "Qty", basePrice: 3600, imageUrl: U("photo-1624345691006-e683ff409f3f"), size: "75 × 70 × 150 cm each", colours: ["Gold", "Red"], materials: ["Wood", "Gold leaf"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor & outdoor", fabrics: ["Velvet", "Satin", "Silk"], attributes: { "Seating capacity": "2", "Frame material": "Carved wood" } },
  { id: "p22", name: "Maharaja Carved Throne", category: "Furniture", subcategory: "Thrones", rateType: "Qty", basePrice: 6500, imageUrl: U("photo-1554104683-c7063687d649"), size: "110 × 85 × 180 cm", colours: ["Gold", "Maroon"], materials: ["Teak", "Brass"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor", fabrics: ["Velvet", "Tissue", "Silk"], attributes: { "Seating capacity": "1", "Frame material": "Carved wood" } },
  { id: "p64", name: "Floral Jhula Swing", category: "Furniture", subcategory: "Thrones", rateType: "Qty", basePrice: 5800, imageUrl: U("photo-1785743045064-2ef77b2502e1"), size: "150 × 70 × 240 cm frame", colours: ["Natural", "Yellow"], materials: ["Teak", "Jute rope", "Fresh florals"], moods: ["Festive", "Boho"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", fabrics: ["Cotton", "Silk"], attributes: { "Seating capacity": "2", "Frame material": "Teak" } },
  { id: "p3", name: "Chiavari Chair", category: "Furniture", subcategory: "Banquet seating", rateType: "Qty", basePrice: 45, imageUrl: "/brand/products/chiavari-chair.png", size: "40 × 45 × 92 cm", colours: ["Gold"], materials: ["Resin"], moods: ["Classic"], themes: ["Modern luxe", "Floral garden"], setting: "Indoor & outdoor", fabrics: ["Satin", "Velvet", "Linen"], attributes: { "Seating capacity": "1", "Frame material": "Resin" } },
  { id: "p85", name: "Napoleon Chair (Ivory)", category: "Furniture", subcategory: "Banquet seating", rateType: "Qty", basePrice: 120, imageUrl: "/brand/products/napoleon-chair-ivory.png", size: "44 × 50 × 92 cm", colours: ["Ivory"], materials: ["Polypropylene"], moods: ["Classic", "Romantic"], themes: ["Floral garden", "Modern luxe", "Corporate"], setting: "Indoor & outdoor", fabrics: ["Satin", "Velvet", "Linen"], attributes: { "Seating capacity": "1", "Frame material": "Moulded resin" } },
  { id: "p25", name: "Tuscany Bench", category: "Furniture", subcategory: "Banquet seating", rateType: "Qty", basePrice: 1800, imageUrl: "/brand/products/tuscany-bench.png", size: "160 × 45 × 48 cm", colours: ["Ivory", "Natural"], materials: ["Wood"], moods: ["Rustic"], themes: ["Floral garden", "Boho"], setting: "Indoor & outdoor", fabrics: ["Linen", "Boucle", "Cotton"], attributes: { "Seating capacity": "3", "Frame material": "Wood" } },
  { id: "p2", name: "Velvet Lounge Sofa", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 4500, imageUrl: U("photo-1590251024078-8a6d9f90b02d"), size: "200 × 90 × 85 cm", colours: ["Emerald"], materials: ["Upholstered", "Wood"], moods: ["Glam"], themes: ["Modern luxe"], setting: "Indoor", fabrics: ["Velvet", "Boucle", "Suede", "Leatherette"], attributes: { "Seating capacity": "3", "Frame material": "Hardwood" } },
  { id: "p23", name: "Haveli Low Sofa", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 3000, imageUrl: "/brand/products/low-haveli-sofa.png", size: "180 × 80 × 60 cm", colours: ["Ivory", "Gold"], materials: ["Sheesham wood"], moods: ["Traditional"], themes: ["Royal heritage", "Haldi & mehendi"], setting: "Indoor & outdoor", fabrics: ["Silk", "Cotton", "Velvet"], attributes: { "Seating capacity": "3", "Frame material": "Sheesham wood" } },
  { id: "p24", name: "Script Print Loveseat", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 2800, imageUrl: "/brand/products/script-print-loveseat.png", size: "140 × 80 × 85 cm", colours: ["Ivory", "Black"], materials: ["Upholstered"], moods: ["Romantic"], themes: ["Modern luxe"], setting: "Indoor", fabrics: ["Linen", "Cotton", "Boucle"], attributes: { "Seating capacity": "2", "Frame material": "Hardwood" } },
  { id: "p16", name: "Majlis Lounge Package", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 12000, imageUrl: U("photo-1615222599276-3d8149bc51ed"), size: "Lounge area 360 × 300 cm", colours: ["Multicolour"], materials: ["Cotton", "Wood"], moods: ["Boho", "Festive"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", fabrics: ["Cotton", "Silk", "Jute"], attributes: { "Seating capacity": "8", "Frame material": "Floor cushions" } },
  { id: "p60", name: "Sufi Mehfil Diwan Set", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 9500, imageUrl: U("photo-1691480152351-4b3f2c89ccff"), size: "Round diwan 300 cm Ø + 12 bolsters", colours: ["Maroon", "Gold"], materials: ["Wood", "Brocade"], moods: ["Regal", "Traditional"], themes: ["Royal heritage", "Boho"], setting: "Indoor & outdoor", fabrics: ["Velvet", "Silk", "Tissue"], attributes: { "Seating capacity": "10", "Frame material": "Low wooden platform" } },
  { id: "p68", name: "Haldi Yellow Baithak Seating", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 4200, imageUrl: U("photo-1529859503572-5b9d1e68e952"), size: "240 × 90 × 45 cm", colours: ["Yellow", "Mustard"], materials: ["Wood", "Cotton"], moods: ["Festive", "Boho"], themes: ["Haldi & mehendi"], setting: "Indoor & outdoor", fabrics: ["Cotton", "Silk", "Jute"], attributes: { "Seating capacity": "4", "Frame material": "Low wooden platform" } },
  { id: "p1", name: "Regal Gold Bar Chair", category: "Furniture", subcategory: "Chairs", rateType: "Qty", basePrice: 450, imageUrl: U("photo-1622759660470-63d4369958ba"), size: "45 × 50 × 105 cm", colours: ["Gold"], materials: ["Metal"], moods: ["Glam"], themes: ["Modern luxe", "Corporate"], setting: "Indoor", fabrics: ["Velvet", "Leatherette"], attributes: { "Seating capacity": "1", "Frame material": "Metal" } },
  { id: "p26", name: "Ghost Acrylic Chair", category: "Furniture", subcategory: "Chairs", rateType: "Qty", basePrice: 300, imageUrl: U("photo-1505843490538-5133c6c7d0e1"), size: "54 × 56 × 92 cm", colours: ["Clear"], materials: ["Acrylic"], moods: ["Minimal"], themes: ["Modern luxe", "Corporate"], setting: "Indoor & outdoor", fabrics: [], attributes: { "Seating capacity": "1", "Frame material": "Acrylic" } },
  { id: "p69", name: "Rattan Peacock Chair", category: "Furniture", subcategory: "Chairs", rateType: "Qty", basePrice: 1600, imageUrl: U("photo-1552324190-9e86fa095c4a"), size: "95 × 70 × 150 cm", colours: ["Natural"], materials: ["Rattan"], moods: ["Boho", "Romantic"], themes: ["Boho", "Haldi & mehendi", "Beach"], setting: "Indoor & outdoor", fabrics: ["Cotton", "Linen"], attributes: { "Seating capacity": "1", "Frame material": "Rattan" } },
  { id: "p4", name: "Round Banquet Table (60in)", category: "Furniture", subcategory: "Tables and consoles", rateType: "Qty", basePrice: 350, imageUrl: U("photo-1738253729030-36051a328db9"), size: "152 cm Ø × 76 cm", colours: ["White"], materials: ["MDF", "Steel"], moods: ["Classic"], themes: ["Corporate", "Floral garden"], setting: "Indoor & outdoor", fabrics: [], attributes: { "Seating capacity": "10", "Frame material": "Steel" } },
  { id: "p5", name: "Marble Cocktail Table", category: "Furniture", subcategory: "Tables and consoles", rateType: "Qty", basePrice: 650, imageUrl: U("photo-1581912492723-688317ba2162"), size: "60 cm Ø × 110 cm", colours: ["Gold", "White"], materials: ["Steel", "Marble"], moods: ["Glam"], themes: ["Corporate", "Modern luxe"], setting: "Indoor & outdoor", fabrics: [], attributes: { "Seating capacity": "4 standing", "Frame material": "Steel" } },
  { id: "p27", name: "Gold Console Table", category: "Furniture", subcategory: "Tables and consoles", rateType: "Qty", basePrice: 7000, imageUrl: U("photo-1543936177-12e24c26776a"), size: "150 × 45 × 85 cm", colours: ["Gold", "White"], materials: ["Wood", "Marble"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor", fabrics: [], attributes: { "Seating capacity": "—", "Frame material": "Carved wood" } },
  { id: "p75", name: "Carved Puja Chowki", category: "Furniture", subcategory: "Tables and consoles", rateType: "Qty", basePrice: 1400, imageUrl: U("photo-1779278547541-370129cc09f7"), size: "90 × 60 × 45 cm", colours: ["Brown", "Gold"], materials: ["Sheesham wood", "Brass inlay"], moods: ["Traditional", "Festive"], themes: ["Festive & puja", "Royal heritage"], setting: "Indoor", fabrics: [], attributes: { "Seating capacity": "—", "Frame material": "Sheesham wood" } },
  { id: "p78", name: "Vintage Wooden Bar Counter", category: "Furniture", subcategory: "Tables and consoles", rateType: "Qty", basePrice: 8500, imageUrl: U("photo-1511389026070-a14ae610a1be"), size: "240 × 70 × 110 cm", colours: ["Brown"], materials: ["Reclaimed wood"], moods: ["Rustic", "Glam"], themes: ["Corporate", "Boho"], setting: "Indoor & outdoor", fabrics: [], attributes: { "Seating capacity": "6 standing", "Frame material": "Reclaimed wood" } },
  { id: "p28", name: "Velvet Pouf Set", category: "Furniture", subcategory: "Ottomans and poufs", rateType: "Qty", basePrice: 900, imageUrl: U("photo-1723223440648-dc41fb3d9a7f"), size: "Set of 4 · 45 cm Ø", colours: ["Blush", "Emerald"], materials: ["Upholstered"], moods: ["Boho", "Romantic"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", fabrics: ["Velvet", "Boucle", "Jute", "Cotton"], attributes: { "Seating capacity": "4", "Frame material": "Foam" } },

  // ───── Brass elements ─────
  { id: "p7", name: "Antique Brass Urn Planter", category: "Brass elements", subcategory: "Urns and vases", rateType: "Qty", basePrice: 450, imageUrl: U("photo-1526198049595-f32cde2a219d"), size: "35 cm Ø × 40 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Traditional"], themes: ["Royal heritage", "Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { Finish: "Antique", Height: "40 cm" } },
  { id: "p29", name: "Brass Candelabra Stand", category: "Brass elements", subcategory: "Candle stands", rateType: "Qty", basePrice: 1200, imageUrl: U("photo-1624807608383-f2a56171d781"), size: "40 cm Ø × 150 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor", attributes: { Finish: "Polished", Height: "150 cm" } },
  { id: "p71", name: "Brass Samai Oil Lamp", category: "Brass elements", subcategory: "Candle stands", rateType: "Qty", basePrice: 950, imageUrl: U("photo-1675507313033-3ac8ae16ef37"), size: "30 cm Ø × 90 cm · 5 tiers", colours: ["Brass"], materials: ["Brass"], moods: ["Traditional", "Festive"], themes: ["Festive & puja"], setting: "Indoor", attributes: { Finish: "Polished", Height: "90 cm" } },
  { id: "p30", name: "Brass Urli Large", category: "Brass elements", subcategory: "Trays and bowls", rateType: "Qty", basePrice: 2500, imageUrl: U("photo-1783454923906-b103b6f21aa8"), size: "90 cm Ø × 25 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Traditional", "Festive"], themes: ["Haldi & mehendi", "Festive & puja"], setting: "Indoor & outdoor", attributes: { Finish: "Hand-beaten", Height: "25 cm" } },
  { id: "p31", name: "Brass Jaali Screen", category: "Brass elements", subcategory: "Jaali screens", rateType: "Qty", basePrice: 4800, imageUrl: U("photo-1772581110464-8e883c62b961"), size: "120 × 200 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor", attributes: { Finish: "Antique", Height: "200 cm" } },
  { id: "p32", name: "Brass Elephant Sculpture", category: "Brass elements", subcategory: "Sculptural pieces", rateType: "Qty", basePrice: 3500, imageUrl: U("photo-1690667939358-50ff2a4f5a50"), size: "60 × 30 × 55 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Traditional"], themes: ["Royal heritage"], setting: "Indoor", attributes: { Finish: "Polished", Height: "55 cm" } },
  { id: "p72", name: "Temple Bell Hangings", category: "Brass elements", subcategory: "Sculptural pieces", rateType: "Qty", basePrice: 1800, imageUrl: U("photo-1729547400907-f68e001458fd"), size: "Set of 12 · 90 cm drops", colours: ["Brass"], materials: ["Brass"], moods: ["Traditional", "Festive"], themes: ["Festive & puja", "Royal heritage"], setting: "Indoor & outdoor", attributes: { Finish: "Antique", Height: "90 cm" } },

  // ───── Flower props ─────
  { id: "p33", name: "Gold Pedestal Vase Stand", category: "Flower props", subcategory: "Vases and stands", rateType: "Qty", basePrice: 800, imageUrl: U("photo-1526198330131-9b0bc79625e4"), size: "30 cm Ø × 110 cm", colours: ["Gold"], materials: ["Metal"], moods: ["Romantic"], themes: ["Floral garden", "Modern luxe"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Faux", "Flower type": "Roses", "Planter height": "110 cm" } },
  { id: "p34", name: "Olive Tree Planter", category: "Flower props", subcategory: "Planters", rateType: "Qty", basePrice: 1500, imageUrl: U("photo-1669144457395-0ea4b03edaac"), size: "50 cm Ø × 180 cm", colours: ["Green", "White"], materials: ["Fibreglass"], moods: ["Minimal"], themes: ["Floral garden", "Beach"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Faux", "Flower type": "Olive", "Planter height": "180 cm" } },
  { id: "p35", name: "Marigold Garland Strings", category: "Flower props", subcategory: "Garlands and strings", rateType: "RFt", basePrice: 60, imageUrl: U("photo-1611784464848-0fc6aa338fac"), size: "Any length · 8 ft drops", colours: ["Yellow", "Orange"], materials: ["Marigold"], moods: ["Festive"], themes: ["Haldi & mehendi", "Festive & puja"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Real", "Flower type": "Marigold", "Planter height": "—" } },
  { id: "p67", name: "Genda Phool Door Toran", category: "Flower props", subcategory: "Garlands and strings", rateType: "Qty", basePrice: 650, imageUrl: U("photo-1692054631975-a734715f4a79"), size: "6 ft wide × 2 ft drop", colours: ["Yellow", "Orange", "Green"], materials: ["Marigold", "Mango leaves"], moods: ["Festive", "Traditional"], themes: ["Festive & puja", "Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Real", "Flower type": "Marigold", "Planter height": "—" } },
  { id: "p74", name: "Mango Leaf Bandhanwar", category: "Flower props", subcategory: "Garlands and strings", rateType: "RFt", basePrice: 45, imageUrl: U("photo-1587334274328-64186a80aeee"), size: "Any length", colours: ["Green"], materials: ["Mango leaves"], moods: ["Traditional"], themes: ["Festive & puja"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Real", "Flower type": "Mango leaf", "Planter height": "—" } },
  { id: "p36", name: "Faux Peony Arrangement", category: "Flower props", subcategory: "Faux florals", rateType: "Qty", basePrice: 1100, imageUrl: U("photo-1689108126286-84c93549336e"), size: "60 × 60 × 50 cm", colours: ["Pink", "Ivory"], materials: ["Silk florals"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor", attributes: { "Real or faux": "Faux", "Flower type": "Peony", "Planter height": "—" } },
  { id: "p77", name: "Dried Pampas Hoop", category: "Flower props", subcategory: "Faux florals", rateType: "Qty", basePrice: 1300, imageUrl: U("photo-1586244897859-2cd81e1cad1f"), size: "120 cm Ø", colours: ["Beige", "Ivory"], materials: ["Dried pampas", "Metal hoop"], moods: ["Boho", "Minimal"], themes: ["Boho", "Beach"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Real", "Flower type": "Pampas", "Planter height": "—" } },
  { id: "p13", name: "Floral Arch", category: "Flower props", subcategory: "Floral backdrops", rateType: "Qty", basePrice: 5500, imageUrl: U("photo-1719415745967-041ef52ad6d9"), size: "250 × 60 × 280 cm", colours: ["Ivory", "Pink"], materials: ["Metal", "Faux florals"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Faux", "Flower type": "Mixed roses", "Planter height": "—" } },
  { id: "p65", name: "Marigold Wall Backdrop", category: "Flower props", subcategory: "Floral backdrops", rateType: "SqFt", basePrice: 85, imageUrl: U("photo-1618559232710-30ab63f178e1"), size: "Up to 12 × 20 ft", colours: ["Yellow", "Orange"], materials: ["Marigold", "Net frame"], moods: ["Festive"], themes: ["Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Real", "Flower type": "Marigold", "Planter height": "—" } },
  { id: "p80", name: "Lotus Pond Installation", category: "Flower props", subcategory: "Floral backdrops", rateType: "Qty", basePrice: 7500, imageUrl: U("photo-1757728113957-36c4ccc43f57"), size: "240 × 120 cm water bed", colours: ["Pink", "White"], materials: ["Faux lotus", "Acrylic"], moods: ["Traditional", "Romantic"], themes: ["Festive & puja", "Floral garden"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Faux", "Flower type": "Lotus", "Planter height": "—" } },

  // ───── Carpets and rugs ─────
  { id: "p9", name: "Persian Area Rug", category: "Carpets and rugs", subcategory: "Persian and traditional", rateType: "SqFt", basePrice: 25, imageUrl: U("photo-1588421874990-1fe162747f9b"), size: "Up to 12 × 18 ft", colours: ["Red", "Blue"], materials: ["Wool blend"], moods: ["Traditional"], themes: ["Royal heritage"], setting: "Indoor", attributes: { Shape: "Rectangle", "Pile and finish": "Low pile", "Coverage available": "Up to 216 sq ft" } },
  { id: "p61", name: "Kilim Floor Rugs", category: "Carpets and rugs", subcategory: "Persian and traditional", rateType: "Qty", basePrice: 1200, imageUrl: U("photo-1726206916341-4f638366c2ed"), size: "180 × 270 cm", colours: ["Red", "Multicolour"], materials: ["Handwoven wool"], moods: ["Boho", "Traditional"], themes: ["Boho", "Royal heritage"], setting: "Indoor & outdoor", attributes: { Shape: "Rectangle", "Pile and finish": "Flat weave", "Coverage available": "52 sq ft" } },
  { id: "p37", name: "Royal Printed Carpet", category: "Carpets and rugs", subcategory: "Printed", rateType: "Qty", basePrice: 2000, imageUrl: U("photo-1551893478-d726eaf0442c"), size: "300 × 200 cm", colours: ["Purple", "Gold"], materials: ["Polyester"], moods: ["Glam"], themes: ["Modern luxe"], setting: "Indoor", attributes: { Shape: "Rectangle", "Pile and finish": "Printed flat", "Coverage available": "65 sq ft" } },
  { id: "p38", name: "Ivory Plain Rug", category: "Carpets and rugs", subcategory: "Plain and solid", rateType: "Qty", basePrice: 1600, imageUrl: U("photo-1763639204536-7663f0f1487b"), size: "240 cm Ø", colours: ["Ivory"], materials: ["Wool blend"], moods: ["Minimal"], themes: ["Modern luxe", "Corporate"], setting: "Indoor", attributes: { Shape: "Round", "Pile and finish": "Shag", "Coverage available": "49 sq ft" } },
  { id: "p8", name: "Red Carpet Runner", category: "Carpets and rugs", subcategory: "Aisle runners", rateType: "RFt", basePrice: 40, imageUrl: U("photo-1786282574955-cba959404d1a"), size: "4 ft wide, any length", colours: ["Red"], materials: ["Needle-punch"], moods: ["Glam"], themes: ["Corporate", "Royal heritage"], setting: "Indoor & outdoor", attributes: { Shape: "Runner", "Pile and finish": "Flat", "Coverage available": "Up to 200 ft" } },
  { id: "p39", name: "Artificial Grass Turf", category: "Carpets and rugs", subcategory: "Outdoor and turf", rateType: "SqFt", basePrice: 18, imageUrl: U("photo-1646034243112-d37c8978cf07"), size: "Rolls of 6 ft width", colours: ["Green"], materials: ["Polyethylene"], moods: ["Boho"], themes: ["Floral garden", "Beach"], setting: "Outdoor", attributes: { Shape: "Roll", "Pile and finish": "35 mm grass", "Coverage available": "Up to 5,000 sq ft" } },

  // ───── Small props ─────
  { id: "p40", name: "Gold Frame Mirror", category: "Small props", subcategory: "Mirrors", rateType: "Qty", basePrice: 1400, imageUrl: U("photo-1656960510709-ca02001aeeeb"), size: "90 × 150 cm", colours: ["Gold"], materials: ["Glass", "Resin frame"], moods: ["Glam"], themes: ["Modern luxe", "Royal heritage"], setting: "Indoor", attributes: { Height: "150 cm", "Sold as set or single": "Single", "Frame finish": "Antique gold" } },
  { id: "p41", name: "Pillar Candle Set", category: "Small props", subcategory: "Candles and holders", rateType: "Qty", basePrice: 700, imageUrl: U("photo-1604478498906-568f56f01523"), size: "Set of 12 · 10–30 cm", colours: ["Ivory"], materials: ["Wax", "Glass"], moods: ["Romantic"], themes: ["Floral garden", "Modern luxe"], setting: "Indoor", attributes: { Height: "10–30 cm", "Sold as set or single": "Set", "Frame finish": "—" } },
  { id: "p62", name: "Brass Diya Clusters", category: "Small props", subcategory: "Candles and holders", rateType: "Qty", basePrice: 600, imageUrl: U("photo-1608070418607-f29f37137376"), size: "Set of 24 · 8 cm Ø", colours: ["Brass", "Warm white"], materials: ["Brass", "Wax"], moods: ["Traditional", "Romantic"], themes: ["Festive & puja", "Royal heritage"], setting: "Indoor & outdoor", attributes: { Height: "6 cm", "Sold as set or single": "Set", "Frame finish": "Antique" } },
  { id: "p81", name: "Clay Diya Tray Set", category: "Small props", subcategory: "Candles and holders", rateType: "Qty", basePrice: 450, imageUrl: U("photo-1577083753695-e010191bacb5"), size: "Set of 51 diyas + 3 trays", colours: ["Terracotta", "Gold"], materials: ["Clay", "Brass"], moods: ["Festive", "Traditional"], themes: ["Festive & puja"], setting: "Indoor & outdoor", attributes: { Height: "4 cm", "Sold as set or single": "Set", "Frame finish": "Hand-painted" } },
  { id: "p11", name: "Floral Table Centrepiece", category: "Small props", subcategory: "Tableware and centrepieces", rateType: "Qty", basePrice: 3200, imageUrl: U("photo-1721814219059-ba22094eb1c3"), size: "60 cm Ø × 80 cm", colours: ["Ivory", "Silver"], materials: ["Fresh florals", "Metal"], moods: ["Glam"], themes: ["Modern luxe", "Corporate"], setting: "Indoor", attributes: { Height: "80 cm", "Sold as set or single": "Single", "Frame finish": "Chrome" } },
  { id: "p79", name: "Gold-Rim Charger Plates", category: "Small props", subcategory: "Tableware and centrepieces", rateType: "Qty", basePrice: 90, imageUrl: U("photo-1610726390560-49954c8cb752"), size: "33 cm Ø · per plate", colours: ["Clear", "Gold"], materials: ["Glass"], moods: ["Glam", "Classic"], themes: ["Modern luxe", "Corporate"], setting: "Indoor & outdoor", attributes: { Height: "2 cm", "Sold as set or single": "Single", "Frame finish": "Gold rim" } },
  { id: "p42", name: "Vintage Books & Curios Set", category: "Small props", subcategory: "Books and curios", rateType: "Qty", basePrice: 600, imageUrl: U("photo-1613577553731-e102e5de62f5"), size: "Set of 10 pieces", colours: ["Brown", "Gold"], materials: ["Paper", "Brass"], moods: ["Rustic"], themes: ["Boho", "Royal heritage"], setting: "Indoor", attributes: { Height: "Up to 25 cm", "Sold as set or single": "Set", "Frame finish": "—" } },
  { id: "p43", name: "Welcome Sign Board", category: "Small props", subcategory: "Signage and frames", rateType: "Qty", basePrice: 3000, imageUrl: U("photo-1691600351222-09b297d09e38"), size: "60 × 90 cm on easel", colours: ["White", "Gold"], materials: ["Wood", "Acrylic"], moods: ["Romantic"], themes: ["Floral garden", "Corporate"], setting: "Indoor & outdoor", attributes: { Height: "160 cm with easel", "Sold as set or single": "Single", "Frame finish": "Gold" } },
  { id: "p76", name: "Custom Neon Sign", category: "Small props", subcategory: "Signage and frames", rateType: "Qty", basePrice: 2500, imageUrl: U("photo-1631058269796-6ea2654cc78b"), size: "Up to 120 × 60 cm", colours: ["Pink", "Warm white"], materials: ["LED neon", "Acrylic"], moods: ["Glam", "Festive"], themes: ["Modern luxe", "Boho"], setting: "Indoor", attributes: { Height: "60 cm", "Sold as set or single": "Single", "Frame finish": "Clear acrylic" } },
  { id: "p44", name: "Silk Cushion & Throw Set", category: "Small props", subcategory: "Cushions and throws", rateType: "Qty", basePrice: 500, imageUrl: U("photo-1578500339042-8059dc18b911"), size: "Set of 6 · 45 × 45 cm", colours: ["Mustard", "Pink"], materials: ["Silk"], moods: ["Festive", "Boho"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", attributes: { Height: "45 cm", "Sold as set or single": "Set", "Frame finish": "—" } },

  // ───── Floor styling ─────
  { id: "p45", name: "LED Dance Floor", category: "Floor styling", subcategory: "Dance floors", rateType: "SqFt", basePrice: 90, imageUrl: U("photo-1785357982905-3f3030172ef3"), size: "2 × 2 ft panels", colours: ["White", "Multicolour"], materials: ["Acrylic", "LED"], moods: ["Glam", "Festive"], themes: ["Modern luxe", "Corporate"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "Up to 576", "Load rating": "500 kg/m²", "Panel size": "2 × 2 ft" } },
  { id: "p14", name: "Stage Platform 12x16", category: "Floor styling", subcategory: "Raised platforms and stages", rateType: "SqFt", basePrice: 22, imageUrl: U("photo-1745573672923-6cf4c5979dd2"), size: "12 × 16 ft · 2 ft high", colours: ["Black"], materials: ["Steel", "Plywood"], moods: ["Classic"], themes: ["Corporate", "Royal heritage"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "192", "Load rating": "750 kg/m²", "Panel size": "4 × 8 ft" } },
  { id: "p63", name: "Qawwali Mehfil Riser", category: "Floor styling", subcategory: "Raised platforms and stages", rateType: "Qty", basePrice: 6000, imageUrl: U("photo-1501258480117-ddc2b0447dab"), size: "16 × 8 ft · 1.5 ft high, carpeted", colours: ["Maroon", "Gold"], materials: ["Steel", "Plywood", "Carpet"], moods: ["Traditional", "Regal"], themes: ["Royal heritage"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "128", "Load rating": "750 kg/m²", "Panel size": "4 × 8 ft" } },
  { id: "p46", name: "Custom Monogram Floor Decal", category: "Floor styling", subcategory: "Floor decals", rateType: "Qty", basePrice: 2200, imageUrl: U("photo-1639434035519-43787d1ec895"), size: "120 cm Ø", colours: ["Gold", "White"], materials: ["Vinyl"], moods: ["Romantic"], themes: ["Modern luxe"], setting: "Indoor", attributes: { "Coverage sq ft": "12", "Load rating": "Walkable", "Panel size": "Single piece" } },
  { id: "p73", name: "Flower Rangoli Floor Art", category: "Floor styling", subcategory: "Floor decals", rateType: "Qty", basePrice: 3500, imageUrl: U("photo-1586864694613-74161b2b3965"), size: "6 ft Ø, made on site", colours: ["Multicolour"], materials: ["Petals", "Rangoli powder"], moods: ["Festive", "Traditional"], themes: ["Festive & puja", "Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "28", "Load rating": "Not walkable", "Panel size": "Single piece" } },
  { id: "p47", name: "Rose Petal Pathway", category: "Floor styling", subcategory: "Pathways", rateType: "RFt", basePrice: 70, imageUrl: U("photo-1612185290152-5c5862fcc167"), size: "3 ft wide, any length", colours: ["Red", "Pink"], materials: ["Faux petals", "Felt"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "3 per running ft", "Load rating": "Walkable", "Panel size": "Roll" } },
  { id: "p48", name: "Carpeted Stage Steps", category: "Floor styling", subcategory: "Steps and risers", rateType: "Qty", basePrice: 1500, imageUrl: U("photo-1658669742598-2f70354c3326"), size: "4 ft wide · 3 steps", colours: ["Red", "Black"], materials: ["Steel", "Carpet"], moods: ["Classic"], themes: ["Corporate", "Royal heritage"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "12", "Load rating": "300 kg", "Panel size": "4 × 3 ft" } },

  // ───── Monumental installations ─────
  { id: "p49", name: "Carved Haveli Entry Gate", category: "Monumental installations", subcategory: "Entry gates and arches", rateType: "Qty", basePrice: 22000, imageUrl: U("photo-1722237476242-4aea48b20565"), size: "360 × 420 cm", colours: ["Ivory", "Gold"], materials: ["Fibreglass", "Wood"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor & outdoor", attributes: { "Height x width": "14 × 12 ft", "Freestanding or suspended": "Freestanding", "Install time": "6 hours" } },
  { id: "p6", name: "Round Mirror Backdrop", category: "Monumental installations", subcategory: "Backdrops and stage sets", rateType: "SqFt", basePrice: 450, imageUrl: U("photo-1626736357861-92d781800060"), size: "Up to 10 × 10 ft", colours: ["Silver"], materials: ["Mirror mosaic", "Metal"], moods: ["Glam"], themes: ["Modern luxe"], setting: "Indoor", attributes: { "Height x width": "10 × 10 ft", "Freestanding or suspended": "Freestanding", "Install time": "3 hours" } },
  { id: "p12", name: "Photo Booth Backdrop", category: "Monumental installations", subcategory: "Backdrops and stage sets", rateType: "Qty", basePrice: 2500, imageUrl: U("photo-1595105579635-662c74f88f05"), size: "240 × 240 cm", colours: ["Multicolour"], materials: ["Printed panel"], moods: ["Festive"], themes: ["Corporate", "Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { "Height x width": "8 × 8 ft", "Freestanding or suspended": "Freestanding", "Install time": "1 hour" } },
  { id: "p70", name: "Ganpati Makhar Backdrop", category: "Monumental installations", subcategory: "Backdrops and stage sets", rateType: "Qty", basePrice: 14500, imageUrl: U("photo-1748431757411-1adcf6c04b54"), size: "240 × 120 × 270 cm", colours: ["Gold", "Red", "Yellow"], materials: ["Eco board", "Fabric", "Faux florals"], moods: ["Festive", "Traditional"], themes: ["Festive & puja"], setting: "Indoor", attributes: { "Height x width": "9 × 8 ft", "Freestanding or suspended": "Freestanding", "Install time": "4 hours" } },
  { id: "p21", name: "Royal Mandap Setup", category: "Monumental installations", subcategory: "Mandaps and canopies", rateType: "Qty", basePrice: 18000, imageUrl: U("photo-1587271636175-90d58cdad458"), size: "400 × 400 × 450 cm", colours: ["Gold", "Red"], materials: ["Wood", "Fabric", "Florals"], moods: ["Regal", "Traditional"], themes: ["Royal heritage"], setting: "Indoor & outdoor", attributes: { "Height x width": "15 × 13 ft", "Freestanding or suspended": "Freestanding", "Install time": "8 hours" } },
  { id: "p17", name: "Floral Mandap Structure", category: "Monumental installations", subcategory: "Mandaps and canopies", rateType: "Qty", basePrice: 8500, imageUrl: U("photo-1587271407850-8d438ca9fdf2"), size: "300 × 300 × 350 cm", colours: ["Ivory", "Pink"], materials: ["Metal", "Faux florals"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor & outdoor", attributes: { "Height x width": "11 × 10 ft", "Freestanding or suspended": "Freestanding", "Install time": "5 hours" } },
  { id: "p15", name: "Peak Pole Tent 40x60", category: "Monumental installations", subcategory: "Mandaps and canopies", rateType: "SqFt", basePrice: 18, imageUrl: U("photo-1766870348043-d41d910edabb"), size: "40 × 60 ft", colours: ["White"], materials: ["PVC", "Aluminium"], moods: ["Classic"], themes: ["Corporate", "Beach"], setting: "Outdoor", attributes: { "Height x width": "20 × 40 ft", "Freestanding or suspended": "Freestanding", "Install time": "1 day" } },
  { id: "p50", name: "Roman Pillars (Pair)", category: "Monumental installations", subcategory: "Pillars and columns", rateType: "Qty", basePrice: 4000, imageUrl: U("photo-1576885078574-a1b053a38e55"), size: "45 cm Ø × 240 cm each", colours: ["White"], materials: ["Fibreglass"], moods: ["Classic", "Regal"], themes: ["Modern luxe", "Royal heritage"], setting: "Indoor & outdoor", attributes: { "Height x width": "8 × 1.5 ft", "Freestanding or suspended": "Freestanding", "Install time": "1 hour" } },
  { id: "p51", name: "Hanging Floral Ceiling", category: "Monumental installations", subcategory: "Ceiling installations", rateType: "SqFt", basePrice: 140, imageUrl: U("photo-1556113275-1c502589049e"), size: "Custom area", colours: ["Ivory", "Green"], materials: ["Faux florals", "Truss"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor", attributes: { "Height x width": "Custom", "Freestanding or suspended": "Suspended", "Install time": "10 hours" } },
  { id: "p66", name: "Paper Umbrella Canopy", category: "Monumental installations", subcategory: "Ceiling installations", rateType: "SqFt", basePrice: 65, imageUrl: U("photo-1581480454597-17a666bb50ec"), size: "Custom area · 60 umbrellas per 400 sq ft", colours: ["Yellow", "Multicolour"], materials: ["Paper umbrellas", "Cable grid"], moods: ["Festive", "Boho"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", attributes: { "Height x width": "Custom", "Freestanding or suspended": "Suspended", "Install time": "5 hours" } },

  // ───── Lighting ─────
  { id: "p52", name: "Crystal Chandelier", category: "Lighting", subcategory: "Chandeliers", rateType: "Qty", basePrice: 5500, imageUrl: U("photo-1769619506093-71d576b39235"), size: "90 cm Ø × 110 cm", colours: ["Clear", "Gold"], materials: ["Crystal", "Metal"], moods: ["Regal", "Glam"], themes: ["Royal heritage", "Modern luxe"], setting: "Indoor", attributes: { "Mounting type": "Ceiling hung", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "Yes" } },
  { id: "p53", name: "Moroccan Pendant Lanterns", category: "Lighting", subcategory: "Pendants and suspended", rateType: "Qty", basePrice: 900, imageUrl: U("photo-1591887090065-e9e64926dd42"), size: "Set of 3 · 30–60 cm", colours: ["Multicolour", "Brass"], materials: ["Metal", "Glass"], moods: ["Boho"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", attributes: { "Mounting type": "Suspended", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "No" } },
  { id: "p82", name: "Hanging Lantern Canopy", category: "Lighting", subcategory: "Pendants and suspended", rateType: "SqFt", basePrice: 75, imageUrl: U("photo-1765814734773-2d5afb68b612"), size: "Custom area · 1 lantern per 8 sq ft", colours: ["Warm white", "Brass"], materials: ["Paper", "Metal"], moods: ["Romantic", "Boho"], themes: ["Boho", "Floral garden"], setting: "Indoor & outdoor", attributes: { "Mounting type": "Suspended", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "Yes" } },
  { id: "p54", name: "LED Uplighter", category: "Lighting", subcategory: "Uplighters and spots", rateType: "Qty", basePrice: 400, imageUrl: U("photo-1761623134341-b746e26f4325"), size: "25 × 15 × 20 cm", colours: ["Black"], materials: ["Aluminium"], moods: ["Glam"], themes: ["Corporate", "Modern luxe"], setting: "Indoor & outdoor", attributes: { "Mounting type": "Floor", "Power source": "Battery", "Colour temperature": "RGB", Dimmable: "Yes" } },
  { id: "p10", name: "String Light Canopy", category: "Lighting", subcategory: "String and fairy lights", rateType: "RFt", basePrice: 60, imageUrl: U("photo-1769447386115-d83f1c26b97a"), size: "Custom spans", colours: ["Warm white"], materials: ["Festoon bulbs"], moods: ["Romantic", "Boho"], themes: ["Floral garden", "Beach"], setting: "Outdoor", attributes: { "Mounting type": "Overhead strung", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "Yes" } },
  { id: "p19", name: "Ambient Fairy Lighting", category: "Lighting", subcategory: "String and fairy lights", rateType: "RFt", basePrice: 55, imageUrl: U("photo-1733499625839-267296a7457b"), size: "Any length", colours: ["Warm white"], materials: ["LED"], moods: ["Romantic"], themes: ["Floral garden", "Haldi & mehendi", "Festive & puja"], setting: "Indoor & outdoor", attributes: { "Mounting type": "Draped", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "No" } },
  { id: "p55", name: "Gold Tripod Floor Lamp", category: "Lighting", subcategory: "Lamps and floor lighting", rateType: "Qty", basePrice: 1100, imageUrl: U("photo-1777322615136-2f1d5d636cc4"), size: "60 cm Ø × 165 cm", colours: ["Gold", "Ivory"], materials: ["Metal", "Linen shade"], moods: ["Glam"], themes: ["Modern luxe"], setting: "Indoor", attributes: { "Mounting type": "Floor", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "Yes" } },

  // ───── Fabric ─────
  { id: "p20", name: "Stage Draping", category: "Fabric", subcategory: "Drapes and curtains", rateType: "RFt", basePrice: 35, imageUrl: U("photo-1723065147450-5bb55f2d6d8d"), size: "10 ft drop", colours: ["Ivory"], materials: ["Polyester"], moods: ["Classic"], themes: ["Royal heritage", "Corporate"], setting: "Indoor & outdoor", fabrics: ["Satin", "Chiffon"], attributes: { "Sheer or opaque": "Opaque", Width: "54 in", "Drop length": "10 ft" } },
  { id: "p56", name: "Ceiling Drape Swag", category: "Fabric", subcategory: "Ceiling drapes", rateType: "SqFt", basePrice: 45, imageUrl: U("photo-1733145857366-fc99411080b8"), size: "Custom ceiling area", colours: ["White", "Blush"], materials: ["Polyester"], moods: ["Romantic"], themes: ["Floral garden", "Modern luxe"], setting: "Indoor", fabrics: ["Chiffon", "Organza", "Net"], attributes: { "Sheer or opaque": "Sheer", Width: "60 in", "Drop length": "Swagged" } },
  { id: "p84", name: "Bandhani Tent Ceiling", category: "Fabric", subcategory: "Ceiling drapes", rateType: "SqFt", basePrice: 55, imageUrl: U("photo-1658863492105-362ff4198a1a"), size: "Custom ceiling area", colours: ["Red", "Yellow", "Multicolour"], materials: ["Cotton"], moods: ["Festive", "Traditional"], themes: ["Haldi & mehendi", "Royal heritage"], setting: "Indoor & outdoor", fabrics: ["Cotton", "Silk"], attributes: { "Sheer or opaque": "Opaque", Width: "44 in", "Drop length": "Pleated" } },
  { id: "p57", name: "Satin Table Linen", category: "Fabric", subcategory: "Table linen", rateType: "Qty", basePrice: 250, imageUrl: U("photo-1528458909336-e7a0adfed0a5"), size: "Fits 60 in round table", colours: ["Ivory", "Gold", "Blush"], materials: ["Satin"], moods: ["Classic", "Glam"], themes: ["Corporate", "Modern luxe"], setting: "Indoor & outdoor", fabrics: ["Satin", "Tissue", "Sequin"], attributes: { "Sheer or opaque": "Opaque", Width: "120 in Ø", "Drop length": "Floor length" } },
  { id: "p58", name: "Chair Covers with Sashes", category: "Fabric", subcategory: "Chair covers and sashes", rateType: "Qty", basePrice: 90, imageUrl: U("photo-1781197479551-dcba5ebcc414"), size: "Universal banquet fit", colours: ["White", "Gold"], materials: ["Spandex"], moods: ["Classic"], themes: ["Corporate", "Floral garden"], setting: "Indoor & outdoor", fabrics: ["Satin", "Organza", "Tissue"], attributes: { "Sheer or opaque": "Opaque", Width: "Standard", "Drop length": "Floor length" } },
  { id: "p59", name: "Sequin Backdrop Cloth", category: "Fabric", subcategory: "Backdrop cloth", rateType: "SqFt", basePrice: 55, imageUrl: U("photo-1652716385284-cd36e2c3a8b8"), size: "Up to 12 × 20 ft", colours: ["Gold", "Rose gold"], materials: ["Sequin mesh"], moods: ["Glam", "Festive"], themes: ["Modern luxe", "Corporate"], setting: "Indoor", fabrics: ["Sequin", "Velvet", "Suede"], attributes: { "Sheer or opaque": "Opaque", Width: "58 in", "Drop length": "Up to 12 ft" } },
  { id: "p83", name: "Mirror-Work Backdrop Panels", category: "Fabric", subcategory: "Backdrop cloth", rateType: "SqFt", basePrice: 70, imageUrl: U("photo-1671535108620-d169ce916f09"), size: "Up to 10 × 16 ft", colours: ["Multicolour", "Silver"], materials: ["Cotton", "Mirror work"], moods: ["Festive", "Boho"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", fabrics: ["Cotton", "Silk"], attributes: { "Sheer or opaque": "Opaque", Width: "48 in", "Drop length": "Up to 10 ft" } },
];

export const COLLECTIONS: Collection[] = [
  {
    id: "royal-heritage",
    bestFor: ["Wedding","Reception","Anniversary"],
    palette: "Crimson · Antique gold · Ivory",
    name: "Royal Heritage",
    tagline: "Carved teak, deep crimson upholstery and hand-blocked cushions for a mandap that reads as heirloom.",
    heroImageUrl: U("photo-1772127822552-ce9ef537bdcf", 1600),
    categories: ["Furniture", "Monumental installations", "Lighting", "Carpets and rugs"],
    productIds: ["p21", "p18", "p22", "p49", "p52", "p9", "p31", "p29"],
  },
  {
    id: "sufi-mehfil",
    bestFor: ["Sufi night","Anniversary","Engagement"],
    palette: "Maroon · Brass · Candlelight",
    name: "Sufi Mehfil",
    tagline: "Low diwans, kilim rugs and a sky of lanterns — an intimate courtyard evening built around the music.",
    heroImageUrl: U("photo-1768700583619-de51ece6d332", 1600),
    categories: ["Furniture", "Lighting", "Carpets and rugs", "Floor styling"],
    productIds: ["p60", "p63", "p61", "p82", "p53", "p62", "p30", "p44"],
  },
  {
    id: "marigold-haldi",
    bestFor: ["Haldi","Mehendi","Puja"],
    palette: "Turmeric · Marigold · Leaf green",
    name: "Marigold Haldi",
    tagline: "Genda phool walls, a floral jhula and paper-umbrella skies in every shade of turmeric.",
    heroImageUrl: U("photo-1744891470538-a80b97c8e116", 1600),
    categories: ["Flower props", "Furniture", "Monumental installations"],
    productIds: ["p65", "p64", "p66", "p68", "p35", "p67", "p69", "p44"],
  },
  {
    id: "ganesh-utsav",
    bestFor: ["Ganesh Chaturthi","Griha pravesh","Puja"],
    palette: "Vermilion · Gold · Marigold",
    name: "Ganesh Utsav",
    tagline: "A makhar fit for Bappa, brass samai lamps, temple bells and fresh toran at every doorway.",
    heroImageUrl: U("photo-1759591590913-a826820f6632", 1600),
    categories: ["Monumental installations", "Brass elements", "Flower props", "Floor styling"],
    productIds: ["p70", "p75", "p71", "p72", "p67", "p74", "p73", "p81"],
  },
  {
    id: "mehendi-mela",
    bestFor: ["Mehendi","Sangeet","Navratri"],
    palette: "Fuchsia · Parrot green · Mirror silver",
    name: "Mehendi Mela",
    tagline: "Mirror-work panels, bandhani ceilings and floor seating for an afternoon that feels like a village fair.",
    heroImageUrl: U("photo-1744891470744-7b0f07f750d1", 1600),
    categories: ["Fabric", "Furniture", "Lighting"],
    productIds: ["p83", "p84", "p16", "p28", "p53", "p76", "p12"],
  },
  {
    id: "monochrome-reception",
    bestFor: ["Reception","Cocktail","Corporate"],
    palette: "Black · White · Crystal",
    name: "Monochrome Reception",
    tagline: "Clean black-and-white styling with mirror walls, crystal and minimal florals.",
    heroImageUrl: U("photo-1769812343338-12a591ef0317", 1600),
    categories: ["Monumental installations", "Furniture", "Small props"],
    productIds: ["p6", "p2", "p5", "p38", "p11", "p79", "p26"],
  },
  {
    id: "amber-dunes",
    bestFor: ["Haldi","Pool party","Sundowner"],
    palette: "Terracotta · Sand · Brass",
    name: "Amber Dunes",
    tagline: "Warm terracotta tones, brass accents and flowing drapes for a golden-hour celebration.",
    heroImageUrl: U("photo-1747115276395-607f2e5dc269", 1600),
    categories: ["Furniture", "Lighting", "Carpets and rugs", "Brass elements"],
    productIds: ["p16", "p77", "p61", "p7", "p19", "p69"],
  },
  {
    id: "garden-evening",
    bestFor: ["Reception","Engagement","Birthday"],
    palette: "Ivory · Sage · Warm white",
    name: "Garden Evening",
    tagline: "Festoon lights, natural wood and soft neutrals for an outdoor reception under the trees.",
    heroImageUrl: U("photo-1769230387364-8b0c2b63e18b", 1600),
    categories: ["Lighting", "Furniture", "Flower props"],
    productIds: ["p10", "p25", "p13", "p34", "p43", "p47"],
  },
  {
    id: "grand-ballroom",
    bestFor: ["Corporate gala","Reception","Award night"],
    palette: "Gold · Ivory · Champagne",
    name: "Grand Ballroom",
    tagline: "Chandeliers, gold chiavari rows and a lit dance floor for a black-tie gala.",
    heroImageUrl: U("photo-1780542900375-0cf459e38fbb", 1600),
    categories: ["Lighting", "Furniture", "Floor styling", "Fabric"],
    productIds: ["p52", "p3", "p4", "p57", "p45", "p54", "p59"],
  },
];

export const BUNDLES: Bundle[] = [
  {
    id: "b4",
    name: "Sufi Night",
    tagline: "An intimate qawwali evening under a sky of lanterns",
    occasion: "Sufi night",
    guests: "80–120",
    setupTime: "6 hours",
    highlights: ["Carpeted riser sized for a 6-piece qawwali party","Round diwan seating with bolsters for close listening","Lantern canopy over the courtyard, dimmable for the performance","Brass urli and diya clusters at the entry"],
    description: "A qawwali mehfil for 80–120 guests: carpeted riser for the musicians, round diwan seating, kilim rugs, brass diyas and a canopy of hanging lanterns.",
    imageUrl: U("photo-1691927644490-e1a24b366a5e", 1200),
    includedProductIds: ["p63", "p60", "p61", "p82", "p53", "p62", "p30", "p44"],
  },
  {
    id: "b5",
    name: "Boho Haldi",
    tagline: "Turmeric-bright, barefoot and made for photos",
    occasion: "Haldi",
    guests: "50–150",
    setupTime: "5 hours",
    highlights: ["Floral jhula as the bride's seat","Marigold wall and toran for the photo backdrop","Paper-umbrella ceiling for shade on a daytime lawn","Low yellow baithak seating for elders"],
    description: "Turmeric-bright and relaxed — a floral jhula, marigold wall, paper-umbrella ceiling, peacock chairs and yellow baithak seating for the family.",
    imageUrl: U("photo-1744891471118-f74c0453cd21", 1200),
    includedProductIds: ["p64", "p65", "p66", "p68", "p69", "p35", "p67", "p44"],
  },
  {
    id: "b6",
    name: "Ganpati Decor",
    tagline: "A makhar fit for Bappa, from sthapana to visarjan",
    occasion: "Ganesh Chaturthi",
    guests: "Home or society pandal",
    setupTime: "4 hours",
    highlights: ["Eco-board makhar with faux florals — no thermocol","Carved chowki sized for idols up to 2.5 ft","Samai lamps, temple bells and diyas for aarti","Fresh toran and flower rangoli refreshed on request"],
    description: "Everything for a home or society pandal: makhar backdrop, carved chowki, samai lamps, temple bells, toran, rangoli and diyas for aarti.",
    imageUrl: U("photo-1617693612355-1d93aeaf0e26", 1200),
    includedProductIds: ["p70", "p75", "p71", "p72", "p67", "p74", "p73", "p81"],
  },
  {
    id: "b1",
    name: "Royal Heritage Stage",
    tagline: "The ceremony stage, styled end to end",
    occasion: "Wedding",
    guests: "200–500",
    setupTime: "10 hours",
    highlights: ["Floral mandap with gold throne chairs","Mirror backdrop behind the couple","Ivory stage draping and fairy lighting","Brass urn planters flanking the steps"],
    description: "A complete styled stage for the main ceremony — floral mandap, gold throne chairs, mirror backdrop, draping and ambient lighting.",
    imageUrl: U("photo-1587271407850-8d438ca9fdf2", 1200),
    includedProductIds: ["p17", "p18", "p6", "p19", "p7", "p20"],
  },
  {
    id: "b7",
    name: "Mehendi Mela",
    tagline: "A colourful village-fair afternoon for the mehendi",
    occasion: "Mehendi",
    guests: "60–150",
    setupTime: "5 hours",
    highlights: ["Majlis floor lounges for the mehendi artists and guests","Mirror-work backdrop and bandhani tent ceiling","Custom neon sign and photo booth corner","Moroccan lanterns for when the evening sets in"],
    description: "Floor-seating lounges, mirror-work backdrop, bandhani ceiling and a photo corner for a colourful mehendi afternoon.",
    imageUrl: U("photo-1744891470493-44321ef136a2", 1200),
    includedProductIds: ["p16", "p83", "p84", "p28", "p53", "p12", "p76"],
  },
  {
    id: "b8",
    name: "Sangeet Glam Night",
    tagline: "Performances first, dance floor till late",
    occasion: "Sangeet",
    guests: "150–300",
    setupTime: "8 hours",
    highlights: ["12 × 16 ft stage with a sequin backdrop","LED dance floor with uplighting","Velvet lounge sofa for the family","Crystal chandelier over the stage"],
    description: "Stage, LED dance floor, sequin backdrop and uplighting — built for performances and a late dance floor.",
    imageUrl: U("photo-1785336872942-567382462077", 1200),
    includedProductIds: ["p14", "p45", "p59", "p54", "p2", "p52", "p76"],
  },
  {
    id: "b2",
    name: "Monochrome Reception",
    tagline: "Black, white and nothing else",
    occasion: "Reception",
    guests: "150–250",
    setupTime: "6 hours",
    highlights: ["Round mirror backdrop for the couple","Emerald velvet lounge set against ivory rugs","Crystal centrepieces and gold-rim chargers","Marble cocktail tables for the bar area"],
    description: "Clean black-and-white styling — mirror walls, upholstered lounge seating, crystal centrepieces and minimal florals.",
    imageUrl: U("photo-1665607437981-973dcd6a22bb", 1200),
    includedProductIds: ["p6", "p2", "p38", "p11", "p5", "p79"],
  },
  {
    id: "b10",
    name: "Diwali Festive Home",
    tagline: "The whole house lit for Lakshmi puja",
    occasion: "Diwali",
    guests: "Home · up to 40",
    setupTime: "3 hours",
    highlights: ["51 clay diyas with brass trays","Lotus pond installation for the entrance","Flower rangoli made on site","Fairy lights for the balcony and façade"],
    description: "Light up the house: clay diya trays, brass diya clusters, lotus pond, rangoli, toran and fairy lights for the balcony.",
    imageUrl: U("photo-1761328119547-97d8bb4050bd", 1200),
    includedProductIds: ["p81", "p62", "p80", "p73", "p67", "p19"],
  },
  {
    id: "b3",
    name: "Amber Dunes Lounge",
    tagline: "Golden-hour lounge with brass and pampas",
    occasion: "Haldi / sundowner",
    guests: "40–100",
    setupTime: "4 hours",
    highlights: ["Majlis lounge with kilim rugs","Dried pampas hoops and brass urns","Festoon string-light canopy","Works for daytime and sunset"],
    description: "Warm marigold-and-brass styling with floor lounges and pampas for a Haldi or golden-hour celebration.",
    imageUrl: U("photo-1777835664050-d11132c2c008", 1200),
    includedProductIds: ["p16", "p7", "p77", "p10", "p61"],
  },
  {
    id: "b9",
    name: "Corporate Gala",
    tagline: "Black-tie ready for 200 guests",
    occasion: "Corporate gala",
    guests: "150–250",
    setupTime: "12 hours",
    highlights: ["Stage, steps and red carpet entry","Banquet rounds in satin linen with chair covers","Crystal centrepieces on every table","RGB uplighting programmed to your brand colours"],
    description: "Stage and steps, banquet rounds dressed in satin, crystal centrepieces, red carpet entry and uplighting for 200 guests.",
    imageUrl: U("photo-1768396855390-0728fa9c21e1", 1200),
    includedProductIds: ["p14", "p48", "p4", "p57", "p58", "p11", "p8", "p54"],
  },
  {
    id: "b11",
    name: "Garden Wedding Reception",
    tagline: "An evening wedding under the open sky",
    occasion: "Reception",
    guests: "100–200",
    setupTime: "7 hours",
    highlights: ["Floral arch for the ceremony","Festoon string-light canopy over the lawn","Tuscany benches and olive tree planters","Rose-petal aisle and welcome sign"],
    description: "A floral arch, festoon canopy, wooden benches and a rose-petal aisle for an evening under the open sky.",
    imageUrl: U("photo-1680695779444-24fc71296e66", 1200),
    includedProductIds: ["p13", "p10", "p25", "p47", "p43", "p34", "p41"],
  },
  {
    id: "b12",
    name: "Godh Bharai & Baby Shower",
    tagline: "Soft pastels and a swing for the mom-to-be",
    occasion: "Baby shower",
    guests: "30–80",
    setupTime: "3 hours",
    highlights: ["Floral jhula as the centrepiece seat","Peony arrangements and ceiling swags","Custom neon sign with the baby's nickname","Photo booth for the family portraits"],
    description: "Soft pastels, a swing for the mom-to-be, peonies, a neon sign and a photo corner for the family.",
    imageUrl: U("photo-1768776183122-95c7d3adbf3e", 1200),
    includedProductIds: ["p64", "p36", "p76", "p12", "p28", "p56"],
  },
];

// Flow 2: "Starter suggestions surface for new plans (entry gate, passage,
// seating, stage, photo booth) — customer can accept or dismiss each."
// `categories` pre-filters the product picker the suggestion opens — a
// suggestion is a prompt to choose something, not a single pre-picked SKU.
export const STARTER_SUGGESTIONS: { key: string; label: string; categories: string[] }[] = [
  { key: "entry-gate", label: "Entry Gate", categories: ["Monumental installations", "Flower props", "Lighting"] },
  { key: "passage", label: "Passage", categories: ["Carpets and rugs", "Floor styling", "Lighting", "Brass elements"] },
  { key: "seating", label: "Seating", categories: ["Furniture"] },
  { key: "stage", label: "Stage", categories: ["Monumental installations", "Floor styling", "Fabric"] },
  { key: "photo-booth", label: "Photo Booth", categories: ["Monumental installations", "Small props", "Lighting"] },
];

// Flow: AI Planner results (screens 44-45) — a fixed curated set stands in for
// a real recommendation engine; "Amber Dunes Lounge Package" maps to the b3
// bundle (expands to its included products on add, same as the Bundle page),
// the rest are single catalog products.
export const AI_PLAN_SUGGESTIONS: { kind: "product" | "bundle"; id: string }[] = [
  { kind: "product", id: "p21" }, // Royal Mandap Setup
  { kind: "product", id: "p18" }, // Gold Throne Chairs (Pair)
  { kind: "product", id: "p13" }, // Floral Arch
  { kind: "product", id: "p6" }, // Round Mirror Backdrop
  { kind: "bundle", id: "b3" }, // Amber Dunes (Lounge Package)
  { kind: "product", id: "p19" }, // Ambient Fairy Lighting
];

export const AI_PLANNER_EVENT_TYPES = ["Wedding", "Haldi", "Mehendi", "Sangeet", "Sufi Night", "Ganpati", "Diwali", "Corporate", "Baby Shower", "Other"];

// Plan Board sub-event ("function") name presets — "Custom" falls through to
// a free-text name in the Add/Edit Sub-Event form instead of one of these.
export const FUNCTION_PRESETS = ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception", "Sufi Night", "Cocktail"] as const;

export function formatRupees(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function rateTypeLabel(rateType: Product["rateType"]): string {
  return rateType === "Qty" ? "per unit" : rateType === "SqFt" ? "per sqft" : "per running ft";
}

// Dates are stored as ISO yyyy-mm-dd; the UI shows them as "9th Sep 2026".
export function formatEventDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][day % 10] ?? "th";
  return `${day}${suffix} ${d.toLocaleString("en-GB", { month: "short" })} ${d.getFullYear()}`;
}

// "9th Sep — 12th Sep 2026" when the range shares a year, the full pair when
// it doesn't, and a single date when start and end match.
export function formatEventDateRange(start?: string, end?: string): string {
  if (!start && !end) return "No date set";
  if (!start) return formatEventDate(end);
  if (!end || end === start) return formatEventDate(start);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return sameYear ? `${formatEventDate(start).replace(/ \d{4}$/, "")} — ${formatEventDate(end)}` : `${formatEventDate(start)} — ${formatEventDate(end)}`;
}
