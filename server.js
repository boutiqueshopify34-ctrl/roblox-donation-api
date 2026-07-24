const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Test de l'API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Roblox Donation API fonctionne !"
    });
});

// Recherche des Game Pass d'un utilisateur
app.get("/gamepasses/:userId", async (req, res) => {

    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            success: false,
            gamePasses: [],
            message: "UserId invalide."
        });
    }

    try {

        // Récupération des expériences publiques du joueur
        const gamesResponse = await fetch(
            `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc`
        );

        if (!gamesResponse.ok) {
            throw new Error("Impossible de récupérer les expériences.");
        }

        const gamesData = await gamesResponse.json();

        const gamePasses = [];

        // Parcours des expériences
        for (const game of gamesData.data || []) {

            const universeId = game.id;

            try {

                const passesResponse = await fetch(
                    `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?limit=100&sortOrder=Asc`
                );

                if (!passesResponse.ok) {
                    continue;
                }

                const passesData = await passesResponse.json();

                for (const pass of passesData.gamePasses || []) {

                    // Seulement les Game Pass en vente
                    if (pass.isForSale === true) {

                        gamePasses.push({
                            Id: pass.id,
                            Name: pass.name,
                            Price: pass.price || 0,
                            Description: pass.description || "",
                            IconImageAssetId: pass.iconImageAssetId || 0
                        });

                    }

                }

            } catch (error) {

                console.log(
                    "Erreur pour l'expérience",
                    universeId,
                    error.message
                );

            }

        }

        // Supprimer les doublons
        const uniquePasses = Array.from(
            new Map(
                gamePasses.map(pass => [pass.Id, pass])
            ).values()
        );

        // Trier du moins cher au plus cher
        uniquePasses.sort(
            (a, b) => a.Price - b.Price
        );

        res.json({
            success: true,
            gamePasses: uniquePasses
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            gamePasses: [],
            message: "Erreur lors de la récupération des Game Pass."
        });

    }

});

app.listen(PORT, () => {

    console.log(
        `Roblox Donation API démarrée sur le port ${PORT}`
    );

});
