/**
 * Minnesota City to County Mapping
 * Maps cities to their respective counties for auto-population
 */
export const MN_CITY_COUNTY_MAP: Record<string, string> = {
    // Anoka County
    "Anoka": "Anoka",
    "Andover": "Anoka",
    "Blaine": "Anoka",
    "Coon Rapids": "Anoka",
    "Fridley": "Anoka",
    "Ham Lake": "Anoka",
    "Lino Lakes": "Anoka",
    "Mounds View": "Anoka",
    "New Brighton": "Anoka",
    "Ramsey": "Anoka",

    // Beltrami County
    "Bemidji": "Beltrami",

    // Benton County
    "Foley": "Benton",
    "St. Cloud": "Benton",

    // Carver County
    "Carver": "Carver",
    "Chaska": "Carver",
    "Eden Prairie": "Carver",
    "Excelsior": "Carver",
    "Mayer": "Carver",
    "Shorewood": "Carver",
    "Tonka Bay": "Carver",
    "Watertown": "Carver",

    // Dakota County
    "Apple Valley": "Dakota",
    "Burnsville": "Dakota",
    "Eagan": "Dakota",
    "Farmington": "Dakota",
    "Inver Grove Heights": "Dakota",
    "Lakeville": "Dakota",
    "Mendota Heights": "Dakota",
    "Miesville": "Dakota",
    "Rosemount": "Dakota",
    "South St. Paul": "Dakota",
    "West St. Paul": "Dakota",

    // Goodhue County
    "Red Wing": "Goodhue",
    "Zumbrota": "Goodhue",

    // Hennepin County
    "Alden": "Hennepin",
    "Bloomington": "Hennepin",
    "Brooklyn Center": "Hennepin",
    "Brooklyn Park": "Hennepin",
    "Champlain": "Hennepin",
    "Chanhope": "Hennepin",
    "Crabapple": "Hennepin",
    "Crystal": "Hennepin",
    "Dayton": "Hennepin",
    "Edina": "Hennepin",
    "Fort Snelling": "Hennepin",
    "Glencoe": "Hennepin",
    "Hanover": "Hennepin",
    "Hopkins": "Hennepin",
    "Independence": "Hennepin",
    "Kenwood": "Hennepin",
    "Lindbergh": "Hennepin",
    "Long Lake": "Hennepin",
    "Loretto": "Hennepin",
    "Louisville": "Hennepin",
    "Maple Grove": "Hennepin",
    "Medina": "Hennepin",
    "Mekota": "Hennepin",
    "Minneapolis": "Hennepin",
    "Minnehaha": "Hennepin",
    "Minnetona": "Hennepin",
    "Minnetonka": "Hennepin",
    "Minniska": "Hennepin",
    "Monticello": "Hennepin",
    "Mound": "Hennepin",
    "New Hope": "Hennepin",
    "Oaks": "Hennepin",
    "Orono": "Hennepin",
    "Oxtongue": "Hennepin",
    "Plymouth": "Hennepin",
    "Princeton": "Hennepin",
    "Richfield": "Hennepin",
    "Robbinsdale": "Hennepin",
    "Rockford": "Hennepin",
    "Saint Louis Park": "Hennepin",
    "Scandia": "Hennepin",
    "South Minneapolis": "Hennepin",
    "Spring Lake Park": "Hennepin",
    "St. Bonifacius": "Hennepin",
    "St. Louis Park": "Hennepin",
    "Upland": "Hennepin",
    "Wacouta": "Hennepin",
    "Wayzata": "Hennepin",
    "Westbloom": "Hennepin",

    // Kandiyohi County
    "Kandiyohi": "Kandiyohi",
    "Willmar": "Kandiyohi",

    // Otter Tail County
    "Fergus Falls": "Otter Tail",
    "Ottertail": "Otter Tail",

    // Ramsey County
    "Falcon Heights": "Ramsey",
    "Lauderdale": "Ramsey",
    "Maplewood": "Ramsey",
    "North St. Paul": "Ramsey",
    "Roseville": "Ramsey",
    "St. Paul": "Ramsey",
    "Shoreview": "Ramsey",
    "Vadnais Heights": "Ramsey",
    "White Bear Lake": "Ramsey",

    // St. Louis County
    "Duluth": "St. Louis",
    "Superior": "St. Louis",

    // Scott County
    "Chanhaska": "Scott",
    "Jordan": "Scott",
    "Shakopee": "Scott",
    "Prior Lake": "Scott",

    // Washington County
    "Afton": "Washington",
    "Bayport": "Washington",
    "Cottage Grove": "Washington",
    "Forest Lake": "Washington",
    "Gladstone": "Washington",
    "Grant": "Washington",
    "Green Oaks": "Washington",
    "Lake Elmo": "Washington",
    "Mahtomedi": "Washington",
    "New Richmond": "Washington",
    "Newport": "Washington",
    "Oak Park Heights": "Washington",
    "Oakdale": "Washington",
    "Stillwater": "Washington",
    "Whitehouse": "Washington",
    "Willernie": "Washington",
    "Woodbury": "Washington",

    // Other major cities (extend as needed)
    "Albert Lea": "Freeborn",
    "Alexandria": "Douglas",
    "Austin": "Mower",
    "Brainerd": "Crow Wing",
    "Crookston": "Polk",
    "Detroit Lakes": "Becker",
    "Faribault": "Rice",
    "Hastings": "Dakota",
    "Hibbing": "St. Louis",
    "International Falls": "Koochiching",
    "Jackson": "Jackson",
    "Litchfield": "Meeker",
    "Luverne": "Rock",
    "Mankato": "Blue Earth",
    "Marshall": "Lyon",
    "Moorhead": "Clay",
    "Morris": "Stevens",
    "New Ulm": "Brown",
    "Northfield": "Rice",
    "Owatonna": "Steele",
    "Pine River": "Cass",
    "Pipestone": "Pipestone",
    "Redwood Falls": "Redwood",
    "Rochester": "Olmsted",
    "Roseau": "Roseau",
    "Sauk Centre": "Stearns",
    "Sauk Rapids": "Benton",
    "Sault Ste. Marie": "Cook",
    "Silverton": "Nicollet",
    "Sleepy Eye": "Brown",
    "Thief River Falls": "Pennington",
    "Two Harbors": "Lake",
    "Tyler": "Lyon",
    "Wadena": "Wadena",
    "Wabasha": "Wabasha",
    "Waite Park": "Stearns",
    "Walker": "Cass",
    "Warroad": "Roseau",
    "Waseca": "Waseca",
    "Wells": "Faribault",
    "Wheaton": "Traverse",
    "Windom": "Cottonwood",
    "Winona": "Winona",
    "Worthington": "Nobles",
    "Zimmerman": "Sherburne",
};

/**
 * Get county for a given Minnesota city
 * Returns the county name or null if not found
 */
export function getCountyForCity(city: string): string | null {
    // Case-insensitive lookup
    const normalizedCity = city
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    return MN_CITY_COUNTY_MAP[normalizedCity] || null;
}

/**
 * Get all cities in a given county
 */
export function getCitiesInCounty(county: string): string[] {
    return Object.entries(MN_CITY_COUNTY_MAP)
        .filter(([_, c]) => c === county)
        .map(([city, _]) => city)
        .sort();
}
