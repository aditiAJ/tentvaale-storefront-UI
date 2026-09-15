import type { Bundle, Collection, Product } from "./types";

const U = (id: string) => `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`;

// Every product is tagged against mock-data/taxonomy.ts. Ids p1–p21 are the
// original catalog (saved plans/orders reference them) re-filed into the new
// categories; p22+ fill out the remaining subcategories. Sizes, materials and
// prices are placeholder data until the real inventory is loaded.
export const PRODUCTS: Product[] = [
  // ───── Furniture ─────
  { id: "p18", name: "Gold Throne Chairs (Pair)", category: "Furniture", subcategory: "Thrones", rateType: "Qty", basePrice: 3600, imageUrl: U("photo-1587271407850-8d438ca9fdf2"), size: "75 × 70 × 150 cm each", colours: ["Gold", "Red"], materials: ["Wood", "Gold leaf"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor & outdoor", fabrics: ["Velvet", "Satin", "Silk"], attributes: { "Seating capacity": "2", "Frame material": "Carved wood" } },
  { id: "p22", name: "Maharaja Throne", category: "Furniture", subcategory: "Thrones", rateType: "Qty", basePrice: 6500, size: "110 × 85 × 180 cm", colours: ["Gold", "Maroon"], materials: ["Teak", "Brass"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor", fabrics: ["Velvet", "Tissue", "Silk"], attributes: { "Seating capacity": "1", "Frame material": "Carved wood" } },
  { id: "p3", name: "Chiavari Chair", category: "Furniture", subcategory: "Banquet seating", rateType: "Qty", basePrice: 45, imageUrl: "/brand/products/chiavari-chair.png", size: "40 × 45 × 92 cm", colours: ["Gold"], materials: ["Resin"], moods: ["Classic"], themes: ["Modern luxe", "Floral garden"], setting: "Indoor & outdoor", fabrics: ["Satin", "Velvet", "Linen"], attributes: { "Seating capacity": "1", "Frame material": "Resin" } },
  { id: "p25", name: "Tuscany Bench", category: "Furniture", subcategory: "Banquet seating", rateType: "Qty", basePrice: 1800, imageUrl: "/brand/products/tuscany-bench.png", size: "160 × 45 × 48 cm", colours: ["Ivory", "Natural"], materials: ["Wood"], moods: ["Rustic"], themes: ["Floral garden", "Boho"], setting: "Indoor & outdoor", fabrics: ["Linen", "Boucle", "Cotton"], attributes: { "Seating capacity": "3", "Frame material": "Wood" } },
  { id: "p2", name: "Velvet Lounge Sofa", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 450, imageUrl: U("photo-1670244208732-fcc8cbd17045"), size: "200 × 90 × 85 cm", colours: ["Emerald"], materials: ["Upholstered", "Wood"], moods: ["Glam"], themes: ["Modern luxe"], setting: "Indoor", fabrics: ["Velvet", "Boucle", "Suede", "Leatherette"], attributes: { "Seating capacity": "3", "Frame material": "Hardwood" } },
  { id: "p23", name: "Haveli Low Sofa", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 3000, imageUrl: "/brand/products/low-haveli-sofa.png", size: "180 × 80 × 60 cm", colours: ["Ivory", "Gold"], materials: ["Sheesham wood"], moods: ["Traditional"], themes: ["Royal heritage", "Haldi & mehendi"], setting: "Indoor & outdoor", fabrics: ["Silk", "Cotton", "Velvet"], attributes: { "Seating capacity": "3", "Frame material": "Sheesham wood" } },
  { id: "p24", name: "Script Print Loveseat", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 2800, imageUrl: "/brand/products/script-print-loveseat.png", size: "140 × 80 × 85 cm", colours: ["Ivory", "Black"], materials: ["Upholstered"], moods: ["Romantic"], themes: ["Modern luxe"], setting: "Indoor", fabrics: ["Linen", "Cotton", "Boucle"], attributes: { "Seating capacity": "2", "Frame material": "Hardwood" } },
  { id: "p16", name: "Majlis Lounge Package", category: "Furniture", subcategory: "Couches", rateType: "Qty", basePrice: 12000, size: "Lounge area 360 × 300 cm", colours: ["Multicolour"], materials: ["Cotton", "Wood"], moods: ["Boho", "Festive"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", fabrics: ["Cotton", "Silk", "Jute"], attributes: { "Seating capacity": "8", "Frame material": "Floor cushions" } },
  { id: "p1", name: "Regal Gold Bar Chair", category: "Furniture", subcategory: "Chairs", rateType: "Qty", basePrice: 450, imageUrl: U("photo-1645108537414-b113b89c049d"), size: "45 × 50 × 105 cm", colours: ["Gold"], materials: ["Metal"], moods: ["Glam"], themes: ["Modern luxe", "Corporate"], setting: "Indoor", fabrics: ["Velvet", "Leatherette"], attributes: { "Seating capacity": "1", "Frame material": "Metal" } },
  { id: "p26", name: "Ghost Acrylic Chair", category: "Furniture", subcategory: "Chairs", rateType: "Qty", basePrice: 300, size: "54 × 56 × 92 cm", colours: ["Clear"], materials: ["Acrylic"], moods: ["Minimal"], themes: ["Modern luxe", "Corporate"], setting: "Indoor & outdoor", fabrics: [], attributes: { "Seating capacity": "1", "Frame material": "Acrylic" } },
  { id: "p4", name: "Round Banquet Table (60in)", category: "Furniture", subcategory: "Tables and consoles", rateType: "Qty", basePrice: 350, size: "152 cm Ø × 76 cm", colours: ["White"], materials: ["MDF", "Steel"], moods: ["Classic"], themes: ["Corporate", "Floral garden"], setting: "Indoor & outdoor", fabrics: [], attributes: { "Seating capacity": "10", "Frame material": "Steel" } },
  { id: "p5", name: "Cocktail Table", category: "Furniture", subcategory: "Tables and consoles", rateType: "Qty", basePrice: 250, size: "60 cm Ø × 110 cm", colours: ["Gold", "White"], materials: ["Steel", "Marble"], moods: ["Glam"], themes: ["Corporate", "Modern luxe"], setting: "Indoor & outdoor", fabrics: [], attributes: { "Seating capacity": "4 standing", "Frame material": "Steel" } },
  { id: "p27", name: "Gold Console Table", category: "Furniture", subcategory: "Tables and consoles", rateType: "Qty", basePrice: 7000, size: "150 × 45 × 85 cm", colours: ["Gold", "White"], materials: ["Wood", "Marble"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor", fabrics: [], attributes: { "Seating capacity": "—", "Frame material": "Carved wood" } },
  { id: "p28", name: "Velvet Pouf Set", category: "Furniture", subcategory: "Ottomans and poufs", rateType: "Qty", basePrice: 900, size: "Set of 4 · 45 cm Ø", colours: ["Blush", "Emerald"], materials: ["Upholstered"], moods: ["Boho", "Romantic"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", fabrics: ["Velvet", "Boucle", "Jute", "Cotton"], attributes: { "Seating capacity": "4", "Frame material": "Foam" } },

  // ───── Brass elements ─────
  { id: "p7", name: "Antique Brass Planter", category: "Brass elements", subcategory: "Urns and vases", rateType: "Qty", basePrice: 450, imageUrl: U("photo-1692616513667-5230c36f3afe"), size: "35 cm Ø × 40 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Traditional"], themes: ["Royal heritage", "Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { Finish: "Antique", Height: "40 cm" } },
  { id: "p29", name: "Brass Candelabra Stand", category: "Brass elements", subcategory: "Candle stands", rateType: "Qty", basePrice: 1200, size: "40 cm Ø × 150 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor", attributes: { Finish: "Polished", Height: "150 cm" } },
  { id: "p30", name: "Brass Urli Large", category: "Brass elements", subcategory: "Trays and bowls", rateType: "Qty", basePrice: 2500, size: "90 cm Ø × 25 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Traditional", "Festive"], themes: ["Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { Finish: "Hand-beaten", Height: "25 cm" } },
  { id: "p31", name: "Brass Jaali Screen", category: "Brass elements", subcategory: "Jaali screens", rateType: "Qty", basePrice: 4800, size: "120 × 200 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor", attributes: { Finish: "Antique", Height: "200 cm" } },
  { id: "p32", name: "Brass Elephant Sculpture", category: "Brass elements", subcategory: "Sculptural pieces", rateType: "Qty", basePrice: 3500, size: "60 × 30 × 55 cm", colours: ["Brass"], materials: ["Brass"], moods: ["Traditional"], themes: ["Royal heritage"], setting: "Indoor", attributes: { Finish: "Polished", Height: "55 cm" } },

  // ───── Flower props ─────
  { id: "p33", name: "Gold Pedestal Vase Stand", category: "Flower props", subcategory: "Vases and stands", rateType: "Qty", basePrice: 800, size: "30 cm Ø × 110 cm", colours: ["Gold"], materials: ["Metal"], moods: ["Romantic"], themes: ["Floral garden", "Modern luxe"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Faux", "Flower type": "Roses", "Planter height": "110 cm" } },
  { id: "p34", name: "Olive Tree Planter", category: "Flower props", subcategory: "Planters", rateType: "Qty", basePrice: 1500, size: "50 cm Ø × 180 cm", colours: ["Green", "White"], materials: ["Fibreglass"], moods: ["Minimal"], themes: ["Floral garden", "Beach"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Faux", "Flower type": "Olive", "Planter height": "180 cm" } },
  { id: "p35", name: "Marigold Garland Strings", category: "Flower props", subcategory: "Garlands and strings", rateType: "RFt", basePrice: 60, size: "Any length · 8 ft drops", colours: ["Yellow", "Orange"], materials: ["Marigold"], moods: ["Festive"], themes: ["Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Real", "Flower type": "Marigold", "Planter height": "—" } },
  { id: "p36", name: "Faux Peony Arrangement", category: "Flower props", subcategory: "Faux florals", rateType: "Qty", basePrice: 1100, size: "60 × 60 × 50 cm", colours: ["Pink", "Ivory"], materials: ["Silk florals"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor", attributes: { "Real or faux": "Faux", "Flower type": "Peony", "Planter height": "—" } },
  { id: "p13", name: "Floral Arch", category: "Flower props", subcategory: "Floral backdrops", rateType: "Qty", basePrice: 5500, size: "250 × 60 × 280 cm", colours: ["Ivory", "Pink"], materials: ["Metal", "Faux florals"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor & outdoor", attributes: { "Real or faux": "Faux", "Flower type": "Mixed roses", "Planter height": "—" } },

  // ───── Carpets and rugs ─────
  { id: "p9", name: "Persian Area Rug", category: "Carpets and rugs", subcategory: "Persian and traditional", rateType: "SqFt", basePrice: 25, size: "Up to 12 × 18 ft", colours: ["Red", "Blue"], materials: ["Wool blend"], moods: ["Traditional"], themes: ["Royal heritage"], setting: "Indoor", attributes: { Shape: "Rectangle", "Pile and finish": "Low pile", "Coverage available": "Up to 216 sq ft" } },
  { id: "p37", name: "Royal Printed Carpet", category: "Carpets and rugs", subcategory: "Printed", rateType: "Qty", basePrice: 2000, size: "300 × 200 cm", colours: ["Purple", "Gold"], materials: ["Polyester"], moods: ["Glam"], themes: ["Modern luxe"], setting: "Indoor", attributes: { Shape: "Rectangle", "Pile and finish": "Printed flat", "Coverage available": "65 sq ft" } },
  { id: "p38", name: "Ivory Plain Rug", category: "Carpets and rugs", subcategory: "Plain and solid", rateType: "Qty", basePrice: 1600, size: "240 cm Ø", colours: ["Ivory"], materials: ["Wool blend"], moods: ["Minimal"], themes: ["Modern luxe", "Corporate"], setting: "Indoor", attributes: { Shape: "Round", "Pile and finish": "Shag", "Coverage available": "49 sq ft" } },
  { id: "p8", name: "Red Carpet Runner", category: "Carpets and rugs", subcategory: "Aisle runners", rateType: "RFt", basePrice: 40, size: "4 ft wide, any length", colours: ["Red"], materials: ["Needle-punch"], moods: ["Glam"], themes: ["Corporate", "Royal heritage"], setting: "Indoor & outdoor", attributes: { Shape: "Runner", "Pile and finish": "Flat", "Coverage available": "Up to 200 ft" } },
  { id: "p39", name: "Artificial Grass Turf", category: "Carpets and rugs", subcategory: "Outdoor and turf", rateType: "SqFt", basePrice: 18, size: "Rolls of 6 ft width", colours: ["Green"], materials: ["Polyethylene"], moods: ["Boho"], themes: ["Floral garden", "Beach"], setting: "Outdoor", attributes: { Shape: "Roll", "Pile and finish": "35 mm grass", "Coverage available": "Up to 5,000 sq ft" } },

  // ───── Small props ─────
  { id: "p40", name: "Gold Frame Mirror", category: "Small props", subcategory: "Mirrors", rateType: "Qty", basePrice: 1400, size: "90 × 150 cm", colours: ["Gold"], materials: ["Glass", "Resin frame"], moods: ["Glam"], themes: ["Modern luxe", "Royal heritage"], setting: "Indoor", attributes: { Height: "150 cm", "Sold as set or single": "Single", "Frame finish": "Antique gold" } },
  { id: "p41", name: "Pillar Candle Set", category: "Small props", subcategory: "Candles and holders", rateType: "Qty", basePrice: 700, size: "Set of 12 · 10–30 cm", colours: ["Ivory"], materials: ["Wax", "Glass"], moods: ["Romantic"], themes: ["Floral garden", "Modern luxe"], setting: "Indoor", attributes: { Height: "10–30 cm", "Sold as set or single": "Set", "Frame finish": "—" } },
  { id: "p11", name: "Crystal Table Centrepiece", category: "Small props", subcategory: "Tableware and centrepieces", rateType: "Qty", basePrice: 3200, size: "60 cm Ø × 80 cm", colours: ["Clear", "Silver"], materials: ["Crystal", "Metal"], moods: ["Glam"], themes: ["Modern luxe", "Corporate"], setting: "Indoor", attributes: { Height: "80 cm", "Sold as set or single": "Single", "Frame finish": "Chrome" } },
  { id: "p42", name: "Vintage Books & Curios Set", category: "Small props", subcategory: "Books and curios", rateType: "Qty", basePrice: 600, size: "Set of 10 pieces", colours: ["Brown", "Gold"], materials: ["Paper", "Brass"], moods: ["Rustic"], themes: ["Boho", "Royal heritage"], setting: "Indoor", attributes: { Height: "Up to 25 cm", "Sold as set or single": "Set", "Frame finish": "—" } },
  { id: "p43", name: "Welcome Sign Board", category: "Small props", subcategory: "Signage and frames", rateType: "Qty", basePrice: 3000, size: "60 × 90 cm on easel", colours: ["White", "Gold"], materials: ["Wood", "Acrylic"], moods: ["Romantic"], themes: ["Floral garden", "Corporate"], setting: "Indoor & outdoor", attributes: { Height: "160 cm with easel", "Sold as set or single": "Single", "Frame finish": "Gold" } },
  { id: "p44", name: "Silk Cushion & Throw Set", category: "Small props", subcategory: "Cushions and throws", rateType: "Qty", basePrice: 500, size: "Set of 6 · 45 × 45 cm", colours: ["Mustard", "Pink"], materials: ["Silk"], moods: ["Festive", "Boho"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", attributes: { Height: "45 cm", "Sold as set or single": "Set", "Frame finish": "—" } },

  // ───── Floor styling ─────
  { id: "p45", name: "LED Dance Floor", category: "Floor styling", subcategory: "Dance floors", rateType: "SqFt", basePrice: 90, size: "2 × 2 ft panels", colours: ["White", "Multicolour"], materials: ["Acrylic", "LED"], moods: ["Glam", "Festive"], themes: ["Modern luxe", "Corporate"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "Up to 576", "Load rating": "500 kg/m²", "Panel size": "2 × 2 ft" } },
  { id: "p14", name: "Stage Platform 12x16", category: "Floor styling", subcategory: "Raised platforms and stages", rateType: "SqFt", basePrice: 22, size: "12 × 16 ft · 2 ft high", colours: ["Black"], materials: ["Steel", "Plywood"], moods: ["Classic"], themes: ["Corporate", "Royal heritage"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "192", "Load rating": "750 kg/m²", "Panel size": "4 × 8 ft" } },
  { id: "p46", name: "Custom Monogram Floor Decal", category: "Floor styling", subcategory: "Floor decals", rateType: "Qty", basePrice: 2200, size: "120 cm Ø", colours: ["Gold", "White"], materials: ["Vinyl"], moods: ["Romantic"], themes: ["Modern luxe"], setting: "Indoor", attributes: { "Coverage sq ft": "12", "Load rating": "Walkable", "Panel size": "Single piece" } },
  { id: "p47", name: "Rose Petal Pathway", category: "Floor styling", subcategory: "Pathways", rateType: "RFt", basePrice: 70, size: "3 ft wide, any length", colours: ["Red", "Pink"], materials: ["Faux petals", "Felt"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "3 per running ft", "Load rating": "Walkable", "Panel size": "Roll" } },
  { id: "p48", name: "Carpeted Stage Steps", category: "Floor styling", subcategory: "Steps and risers", rateType: "Qty", basePrice: 1500, size: "4 ft wide · 3 steps", colours: ["Red", "Black"], materials: ["Steel", "Carpet"], moods: ["Classic"], themes: ["Corporate", "Royal heritage"], setting: "Indoor & outdoor", attributes: { "Coverage sq ft": "12", "Load rating": "300 kg", "Panel size": "4 × 3 ft" } },

  // ───── Monumental installations ─────
  { id: "p49", name: "Carved Haveli Entry Gate", category: "Monumental installations", subcategory: "Entry gates and arches", rateType: "Qty", basePrice: 22000, size: "360 × 420 cm", colours: ["Ivory", "Gold"], materials: ["Fibreglass", "Wood"], moods: ["Regal"], themes: ["Royal heritage"], setting: "Indoor & outdoor", attributes: { "Height x width": "14 × 12 ft", "Freestanding or suspended": "Freestanding", "Install time": "6 hours" } },
  { id: "p6", name: "Round Mirror Backdrop", category: "Monumental installations", subcategory: "Backdrops and stage sets", rateType: "SqFt", basePrice: 450, imageUrl: U("photo-1775135595214-f945982d9cc4"), size: "Up to 10 × 10 ft", colours: ["Silver"], materials: ["Mirror mosaic", "Metal"], moods: ["Glam"], themes: ["Modern luxe"], setting: "Indoor", attributes: { "Height x width": "10 × 10 ft", "Freestanding or suspended": "Freestanding", "Install time": "3 hours" } },
  { id: "p12", name: "Photo Booth Backdrop", category: "Monumental installations", subcategory: "Backdrops and stage sets", rateType: "Qty", basePrice: 2500, size: "240 × 240 cm", colours: ["Multicolour"], materials: ["Printed panel"], moods: ["Festive"], themes: ["Corporate", "Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { "Height x width": "8 × 8 ft", "Freestanding or suspended": "Freestanding", "Install time": "1 hour" } },
  { id: "p21", name: "Royal Mandap Setup", category: "Monumental installations", subcategory: "Mandaps and canopies", rateType: "Qty", basePrice: 18000, imageUrl: U("photo-1587271407850-8d438ca9fdf2"), size: "400 × 400 × 450 cm", colours: ["Gold", "Red"], materials: ["Wood", "Fabric", "Florals"], moods: ["Regal", "Traditional"], themes: ["Royal heritage"], setting: "Indoor & outdoor", attributes: { "Height x width": "15 × 13 ft", "Freestanding or suspended": "Freestanding", "Install time": "8 hours" } },
  { id: "p17", name: "Floral Mandap Structure", category: "Monumental installations", subcategory: "Mandaps and canopies", rateType: "Qty", basePrice: 8500, imageUrl: U("photo-1587271407850-8d438ca9fdf2"), size: "300 × 300 × 350 cm", colours: ["Ivory", "Pink"], materials: ["Metal", "Faux florals"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor & outdoor", attributes: { "Height x width": "11 × 10 ft", "Freestanding or suspended": "Freestanding", "Install time": "5 hours" } },
  { id: "p15", name: "Peak Pole Tent 40x60", category: "Monumental installations", subcategory: "Mandaps and canopies", rateType: "SqFt", basePrice: 18, size: "40 × 60 ft", colours: ["White"], materials: ["PVC", "Aluminium"], moods: ["Classic"], themes: ["Corporate", "Beach"], setting: "Outdoor", attributes: { "Height x width": "20 × 40 ft", "Freestanding or suspended": "Freestanding", "Install time": "1 day" } },
  { id: "p50", name: "Roman Pillars (Pair)", category: "Monumental installations", subcategory: "Pillars and columns", rateType: "Qty", basePrice: 4000, size: "45 cm Ø × 240 cm each", colours: ["White"], materials: ["Fibreglass"], moods: ["Classic", "Regal"], themes: ["Modern luxe", "Royal heritage"], setting: "Indoor & outdoor", attributes: { "Height x width": "8 × 1.5 ft", "Freestanding or suspended": "Freestanding", "Install time": "1 hour" } },
  { id: "p51", name: "Hanging Floral Ceiling", category: "Monumental installations", subcategory: "Ceiling installations", rateType: "SqFt", basePrice: 140, size: "Custom area", colours: ["Ivory", "Green"], materials: ["Faux florals", "Truss"], moods: ["Romantic"], themes: ["Floral garden"], setting: "Indoor", attributes: { "Height x width": "Custom", "Freestanding or suspended": "Suspended", "Install time": "10 hours" } },

  // ───── Lighting ─────
  { id: "p52", name: "Crystal Chandelier", category: "Lighting", subcategory: "Chandeliers", rateType: "Qty", basePrice: 5500, size: "90 cm Ø × 110 cm", colours: ["Clear", "Gold"], materials: ["Crystal", "Metal"], moods: ["Regal", "Glam"], themes: ["Royal heritage", "Modern luxe"], setting: "Indoor", attributes: { "Mounting type": "Ceiling hung", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "Yes" } },
  { id: "p53", name: "Moroccan Pendant Lanterns", category: "Lighting", subcategory: "Pendants and suspended", rateType: "Qty", basePrice: 900, size: "Set of 3 · 30–60 cm", colours: ["Multicolour", "Brass"], materials: ["Metal", "Glass"], moods: ["Boho"], themes: ["Haldi & mehendi", "Boho"], setting: "Indoor & outdoor", attributes: { "Mounting type": "Suspended", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "No" } },
  { id: "p54", name: "LED Uplighter", category: "Lighting", subcategory: "Uplighters and spots", rateType: "Qty", basePrice: 400, size: "25 × 15 × 20 cm", colours: ["Black"], materials: ["Aluminium"], moods: ["Glam"], themes: ["Corporate", "Modern luxe"], setting: "Indoor & outdoor", attributes: { "Mounting type": "Floor", "Power source": "Battery", "Colour temperature": "RGB", Dimmable: "Yes" } },
  { id: "p10", name: "String Light Canopy", category: "Lighting", subcategory: "String and fairy lights", rateType: "RFt", basePrice: 60, size: "Custom spans", colours: ["Warm white"], materials: ["Festoon bulbs"], moods: ["Romantic", "Boho"], themes: ["Floral garden", "Beach"], setting: "Outdoor", attributes: { "Mounting type": "Overhead strung", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "Yes" } },
  { id: "p19", name: "Ambient Fairy Lighting", category: "Lighting", subcategory: "String and fairy lights", rateType: "RFt", basePrice: 55, imageUrl: U("photo-1587271407850-8d438ca9fdf2"), size: "Any length", colours: ["Warm white"], materials: ["LED"], moods: ["Romantic"], themes: ["Floral garden", "Haldi & mehendi"], setting: "Indoor & outdoor", attributes: { "Mounting type": "Draped", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "No" } },
  { id: "p55", name: "Gold Tripod Floor Lamp", category: "Lighting", subcategory: "Lamps and floor lighting", rateType: "Qty", basePrice: 1100, size: "60 cm Ø × 165 cm", colours: ["Gold", "Ivory"], materials: ["Metal", "Linen shade"], moods: ["Glam"], themes: ["Modern luxe"], setting: "Indoor", attributes: { "Mounting type": "Floor", "Power source": "Mains", "Colour temperature": "Warm white", Dimmable: "Yes" } },

  // ───── Fabric ─────
  { id: "p20", name: "Stage Draping", category: "Fabric", subcategory: "Drapes and curtains", rateType: "RFt", basePrice: 35, imageUrl: U("photo-1587271407850-8d438ca9fdf2"), size: "10 ft drop", colours: ["Ivory"], materials: ["Polyester"], moods: ["Classic"], themes: ["Royal heritage", "Corporate"], setting: "Indoor & outdoor", fabrics: ["Satin", "Chiffon"], attributes: { "Sheer or opaque": "Opaque", Width: "54 in", "Drop length": "10 ft" } },
  { id: "p56", name: "Ceiling Drape Swag", category: "Fabric", subcategory: "Ceiling drapes", rateType: "SqFt", basePrice: 45, size: "Custom ceiling area", colours: ["White", "Blush"], materials: ["Polyester"], moods: ["Romantic"], themes: ["Floral garden", "Modern luxe"], setting: "Indoor", fabrics: ["Chiffon", "Organza", "Net"], attributes: { "Sheer or opaque": "Sheer", Width: "60 in", "Drop length": "Swagged" } },
  { id: "p57", name: "Satin Table Linen", category: "Fabric", subcategory: "Table linen", rateType: "Qty", basePrice: 250, size: "Fits 60 in round table", colours: ["Ivory", "Gold", "Blush"], materials: ["Satin"], moods: ["Classic", "Glam"], themes: ["Corporate", "Modern luxe"], setting: "Indoor & outdoor", fabrics: ["Satin", "Tissue", "Sequin"], attributes: { "Sheer or opaque": "Opaque", Width: "120 in Ø", "Drop length": "Floor length" } },
  { id: "p58", name: "Chair Covers with Sashes", category: "Fabric", subcategory: "Chair covers and sashes", rateType: "Qty", basePrice: 90, size: "Universal banquet fit", colours: ["White", "Gold"], materials: ["Spandex"], moods: ["Classic"], themes: ["Corporate", "Floral garden"], setting: "Indoor & outdoor", fabrics: ["Satin", "Organza", "Tissue"], attributes: { "Sheer or opaque": "Opaque", Width: "Standard", "Drop length": "Floor length" } },
  { id: "p59", name: "Sequin Backdrop Cloth", category: "Fabric", subcategory: "Backdrop cloth", rateType: "SqFt", basePrice: 55, size: "Up to 12 × 20 ft", colours: ["Gold", "Rose gold"], materials: ["Sequin mesh"], moods: ["Glam", "Festive"], themes: ["Modern luxe", "Corporate"], setting: "Indoor", fabrics: ["Sequin", "Velvet", "Suede"], attributes: { "Sheer or opaque": "Opaque", Width: "58 in", "Drop length": "Up to 12 ft" } },
];

export const COLLECTIONS: Collection[] = [
  {
    id: "royal-heritage",
    name: "Royal Heritage",
    tagline: "Carved teak, deep crimson upholstery and hand-blocked cushions for a mandap that reads as heirloom.",
    heroImageUrl: "https://images.unsplash.com/photo-1772127822552-ce9ef537bdcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    categories: ["Furniture", "Lighting", "Carpets and rugs"],
    productIds: ["p18", "p1", "p6", "p9", "p11"],
  },
  {
    id: "monochrome-reception",
    name: "Monochrome Reception",
    tagline: "Clean black-and-white styling with mirror walls and minimal florals.",
    heroImageUrl: "https://images.unsplash.com/photo-1716538878686-38567b89b5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    categories: ["Monumental installations", "Furniture"],
    productIds: ["p6", "p2", "p5", "p9"],
  },
  {
    id: "amber-dunes",
    name: "Amber Dunes",
    tagline: "Warm terracotta tones, brass accents and flowing drapes for a golden-hour celebration.",
    heroImageUrl: "https://images.unsplash.com/photo-1747115276395-607f2e5dc269?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    categories: ["Furniture", "Lighting", "Carpets and rugs", "Brass elements"],
    productIds: ["p1", "p11", "p9", "p7", "p19", "p3"],
  },
  {
    id: "garden-evening",
    name: "Garden Evening",
    tagline: "String lights, natural cane and soft neutrals for an outdoor reception.",
    heroImageUrl: "https://images.unsplash.com/photo-1651472652024-6ca9278d53a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    categories: ["Lighting", "Furniture"],
    productIds: ["p10", "p2", "p8"],
  },
];

export const BUNDLES: Bundle[] = [
  {
    id: "b1",
    name: "Royal Heritage Stage Package",
    description: "A complete styled stage setup with floral mandap, gold seating and ambient lighting for your main ceremony.",
    imageUrl: "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
    includedProductIds: ["p17", "p18", "p6", "p19", "p7", "p20"],
  },
  {
    id: "b2",
    name: "Monochrome Reception",
    description: "Clean black-and-white styling — mirror walls, upholstered lounge seating and minimal florals.",
    imageUrl: "https://images.unsplash.com/photo-1716538878686-38567b89b5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
    includedProductIds: ["p6", "p2", "p9"],
  },
  {
    id: "b3",
    name: "Amber Dunes",
    description: "Warm marigold-and-brass styling for a Haldi or daytime celebration.",
    imageUrl: "https://images.unsplash.com/photo-1632296521966-b19f0d728635?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
    includedProductIds: ["p7", "p13", "p10"],
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

export const AI_PLANNER_EVENT_TYPES = ["Wedding", "Haldi", "Corporate", "Fashion Shoot", "Luxury Lounge", "Other"];

// Plan Board sub-event ("function") name presets — "Custom" falls through to
// a free-text name in the Add/Edit Sub-Event form instead of one of these.
export const FUNCTION_PRESETS = ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"] as const;

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
