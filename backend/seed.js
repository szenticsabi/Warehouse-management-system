import { faker } from "@faker-js/faker";
import bcrypt from 'bcrypt';
import connectDB from './database/connection.js';
import User from './models/User.js';
import Warehouse from './models/Warehouse.js';
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Category from "./models/Category.js";
import ToOrder from "./models/toOrder.js";
import mongoose from "mongoose";


const main = async () => {
    try {

        // Connect to the database (MongoDB Atlas)
        await connectDB();


        // Deleting the old data
        await Promise.all([
            User.deleteMany({}),
            Warehouse.deleteMany({}),
            Product.deleteMany({}),
            Order.deleteMany({}),
            Category.deleteMany({}),
            ToOrder.deleteMany({})
        ]
        )


        // ---USERS---

        // Creating one admin user with encrypted password
        const hashAdmPassword = await bcrypt.hash("admin", 10);
        const newAdminUser = new User({
            name: "admin",
            email: "admin@warehouse.com",
            password: hashAdmPassword,
            role: "admin",
            shift: "morning"
        })

        await newAdminUser.save();
        console.log("Admin user created succesfully");

        // Creating 10 users with worker role
        const hashEmpPassword = await bcrypt.hash("employee", 10);
        const shiftEnum = User.schema.path("shift").options.enum;
        for (let i = 0; i < 10; i++) {
            const newWorker = new User({
                name: faker.person.fullName(),
                email: faker.internet.email(),
                password: hashEmpPassword,
                role: "employee",
                shift: faker.helpers.arrayElement(shiftEnum)
            })

            await newWorker.save();
        }
        console.log("Employee users created");


        // ---WAREHOUSE---

        // Shuffle warehouse names with faker to avoid name conflicts
        const warehouseShuffle = faker.helpers.shuffle([
            "Central Warehouse",
            "South Warehouse",
            "North Warehouse",
            "East Warehouse",
            "West Warehouse"]);

        // Creating 5 warehouses with unique names
        for (let i = 1; i <= 5; i++) {
            if (warehouseShuffle.length == 0) throw new Error("Not enough unique warehouse names");
            const name = warehouseShuffle.pop();

            const warehouse = new Warehouse({
                id: i,
                name,
                address: faker.location.streetAddress(),
            });

            await warehouse.save();
        }
        console.log("Warehouses created");


        // ---Category---

        // Shuffle category names with faker to avoid name conflicts
        const categoryNames = faker.helpers.shuffle([
            "Clothing",
            "Books",
            "Furniture",
            "Electronics",
            "Groceries",
            "Health",
            "Pet Supplies",
            "Office Supplies",
            "School",
            "Shoes and Accessories",
            "Beauty and Personal Care",
            "Toys and Games"
        ]);

        // Creating 12 categories with unique names
        // Descriptions are not matching with tha names, these just test data
        for (let i = 1; i < 13; i++) {
            if (categoryNames.length == 0) throw new Error("Not enough unique category names");
            const name = categoryNames.pop();

            const category = new Category({
                id: i,
                name,
                description: faker.commerce.productDescription()
            })

            await category.save();

        }
        console.log("Categories created");


        // ---Product--- (Have to be after Category and Warehouse sections)

        // Finding categories and warehoueses
        const categories = await Category.find({}, "name _id").lean();
        const warehouses = await Warehouse.find({}, "_id").lean();

        for (let i = 1; i <= 100; i++) {

            const randCategory = faker.helpers.arrayElement(categories);
            const randWarehouse = faker.helpers.arrayElement(warehouses);

            const product = new Product({
                name: faker.commerce.productName(),
                sku: faker.string.alphanumeric(6).toUpperCase(),
                price: Number(faker.commerce.price({ min: 1, max: 55000 })),
                stock: Number(faker.number.int({ min: 1, max: 150 })),
                category: randCategory._id,
                warehouse: randWarehouse._id
            })

            await product.save();

        }
        console.log("Products created");


        // ---Order--- (Have to be after the Product section)

        // Queries all 'id' fields in JS object
        const productsToOrder = await Product.find({}, "_id").lean();
        if (!productsToOrder.length) throw new Error("No products to create orders from.");

        // Finding the highest order id
        const lastId = await Order.findOne().sort({ id: -1 }).select("id").lean();
        let nextId = lastId ? lastId.id + 1 : 1;

        const pick = () => faker.helpers.arrayElement(productsToOrder)._id;


        // Creating 15 orders with random products
        for (let i = 1; i < 16; i++) {

            const itemCount = faker.number.int({ min: 1, max: 6 });

            const usedItems = new Set();

            const items = [];
            for (let o = 0; o < itemCount; o++) {
                let productionId;
                do {
                    productionId = pick();
                } while (usedItems.has(String(productionId)))
                usedItems.add(String(productionId));

                items.push({
                    product: productionId,
                    qty: faker.number.int({ min: 1, max: 8 })
                })
            }

            const order = new Order({
                id: nextId,
                items
            })

            await order.save();
            nextId++;

        }
        console.log("Orders created");




        await mongoose.connection.close();
        console.log("Database seeded and connection closed");

    } catch (error) {
        console.log(error);
        await mongoose.connection.close();
    }
}

main();