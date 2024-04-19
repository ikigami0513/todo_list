import * as express from "express";
import * as path from "path";
import mongoose, { Schema, Document } from "mongoose";

// ---------- General Setup ----------
const app = express();
app.set("port", process.env.PORT || 3000);
app.use(express.json());

let http = require("http").Server(app);

const dbURI = "mongodb://localhost:27017/todo_app";
mongoose.connect(dbURI);
// ---------- End General Setup ----------

// ---------- Mongoose Schema ----------
interface ITask extends Document {
    title: string;
    description: string;
    end: boolean;
}

const taskSchema: Schema<ITask> = new Schema<ITask>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    end: { type: Boolean, default: false }
});

const Task = mongoose.model<ITask>("Task", taskSchema);
// ---------- End Mongoose Schema ----------

// ---------- Routes ----------
app.get("/", (req: express.Request, res: express.Response) => {
    res.sendFile(path.resolve("./client/index.html"));
});

app.get("/task", async (req: express.Request, res: express.Response) => {
    const tasks = await Task.find();
    res.status(200).json(tasks);
});

app.get("/task/:ID", async (req: express.Request, res: express.Response) => {
    try {
        const taskID = req.params.ID;
        const task = await Task.findById(taskID);

        if (!task) {
            return res.status(404).json({ message: "Tâche non trouvée"});
        }

        res.status(200).json(task);
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
});

app.post("/task", async (req: express.Request, res: express.Response) => {
    try {
        const { title, description } = req.body;

        const newTask = new Task({
            title,
            description,
            end: false // Par défaut, la nouvelle tâche n'est pas terminée
        });

        const savedTask = await newTask.save();

        res.status(201).json(savedTask);
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
});

app.put("/task/:ID", async (req: express.Request, res: express.Response) => {
    try {
        const taskID = req.params.ID;
        const { title, description, end } = req.body;

        const task = await Task.findById(taskID);

        if (!task) {
            return res.status(404).json({ message: "Tâche non trouvée "});
        }

        if (title) task.title = title;
        if (description) task.description = description;
        if (typeof end === "boolean") task.end = end;

        const updatedTask = await task.save();
        res.status(200).json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
});

app.delete("/task/:ID", async (req: express.Request, res: express.Response) => {
    try {
        const taskID = req.params.ID;
        const deletedTask = await Task.findByIdAndDelete(taskID);

        if (!deletedTask) {
            return res.status(404).json({ message: "Tâche non trouvée." });
        }

        res.status(200).json({ message: "Tâche supprimée avec succès."});
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
});
// ---------- End Routes ----------

// ---------- Start application ----------
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Erreur de connexion à la base de données : "));
db.once("open", () => {
    console.log("Connexion réussie à la base de donnée MongoDB");
    const server = http.listen(3000, function() {
        console.log("listening on *:3000");
    });
});
// ---------- End Start application ----------