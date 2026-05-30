// data/flowers.js

export const flowers = [
    {
        id: 1, 
        name: "Гвоздика головка", 
        description: "Материал: Шелк",
        image: "../images/flowers/carnationcat1.jpg", 
        category: "carnations",
        badge: "Хит",
        variations: [
            { 
                color: "yellow", 
                hex: "#fbbf24", 
                price: 25, 
                image: "../images/flowers/carnationcat1.jpg" 
            },
            { 
                color: "red", 
                hex: "#dc2626", 
                price: 20, 
                image: "../images/flowers/carnationcat2.jpg" 
            },
            { 
                color: "blue", 
                hex: "#3b82f6", 
                price: 22, 
                image: "../images/flowers/carnationcat3.jpg" 
            }
        ]
    },

    {
        id: 2,
        name: "Ромашка",
        description: "Материал: ткань",
        category: "chamomiles",
        badge: null,
        variations: [
            {
                color: "white",
                hex: "#f3f4f6",
                price: 12,
                image: "../images/flowers/chamomilecat1.jpg"
            }
        ]
    },
    {
        id: 3,
        name: "Хризантема",
        description: "Материал: шелк",
        category: "chrysanthemums",
        badge: null,
        variations: [
            {
                color: "yellow",
                hex: "#fbbf24",
                price: 15,
                image: "../images/flowers/chrysanthemumcat3.jpg"
            },
            {
                color: "red",
                hex: "#e6a356",
                price: 16,
                image: "../images/flowers/chrysanthemumcat1.jpg"
            },
            {
                color: "pink",
                hex: "#ea9fe0",
                price: 15,
                image: "../images/flowers/chrysanthemumcat2.jpg"
            },
            {
                color: "red",
                hex: "#ff0000",
                price: 22,
                image: "../images/flowers/сhrysanthemumcat5.jpg"
            },
            {
                color: "pink",
                hex: "#ec4899",
                price: 29,
                image: "../images/flowers/сhrysanthemumcat4.jpg"
            }
        ]
    },
    {
        id: 4,
        name: "Георгин",
        description: "Материал: атлас",
        category: "dahlias",
        variations: [
            {
                color: "orange",
                hex: "#f97316",
                price: 18,
                image: "../images/flowers/dahliacat1.jpg"
            },
            {
                color: "purple",
                hex: "#a855f7",
                price: 20,
                image: "../images/flowers/dahliacat2.jpg"
            },
            {
                color: "pink",
                hex: "#ec4899",
                price: 20,
                image: "../images/flowers/dahliacat3.jpg"
            }
        ]
    },

    {
        id: 5,
        name: "Роза",
        description: "Материал: шелк",
        category: "rose",
        badge: "Новинка",
        variations: [
            {
                color: "red",
                hex: "#ff0000",
                price: 34,
                image: "../images/flowers/rosecat1.jpg"
            },
            {
                color: "yellow",
                hex: "#fbbf24",
                price: 40,
                image: "../images/flowers/rosecat3.jpg"
            },
            {
                color: "pink",
                hex: "#ec4899",
                price: 30,
                image: "../images/flowers/rosecat2.jpg"
            }
        ]
    },
    {
        id: 6,
        name: "Роза малая",
        description: "Материал: шелк",
        category: "rose",
        variations: [
            {
                color: "red",
                hex: "#ff0000",
                price: 50,
                image: "../images/flowers/rosamalayacat1.jpg"
            },
            {
                color: "white",
                hex: "#ffffff",
                price: 30,
                image: "../images/flowers/rosamalayacat3.jpg"
            },
            {
                color: "pink",
                hex: "#ec4899",
                price: 40,
                image: "../images/flowers/rosamalayacat2.jpg"
            }
        ]
    },
    {
        id: 7,
        name: "Роза крутая",
        description: "Материал: шелк",
        category: "rose",
        variations: [
            {
                color: "white",
                hex: "#ffffff",
                price: 54,
                image: "../images/flowers/rosecat6.jpg"
            },
            {
                color: "yellow",
                hex: "#fbbf24",
                price: 60,
                image: "../images/flowers/rosecat5.jpg"
            },
            {
                color: "purple",
                hex: "#a855f7",
                price: 70,
                image: "../images/flowers/rosecat4.jpg"
            }
        ]
    },
    {
        id: 8,
        name: "Шелковая роза",
        description: "Материал: шелк",
        category: "rose",
        variations: [
            {
                color: "black",
                hex: "#000000",
                price: 84,
                image: "../images/flowers/silkrosecat1.jpg"
            },
            {
                color: "yellow",
                hex: "#fbbf24",
                price: 60,
                image: "../images/flowers/silkrosecat2.jpg"
            },
            {
                color: "blackpink",
                hex: "#6e076b",
                price: 90,
                image: "../images/flowers/silkrosecat3.jpg"
            }
        ]
    },
    
     
];

export default flowers;