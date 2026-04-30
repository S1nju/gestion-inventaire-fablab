<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Labo;
use App\Models\Armoir;
use App\Models\Casier;
use App\Models\Item;
use App\Models\CasierType;
use App\Models\Encadrant;
use App\Models\Project;
use App\Models\ComponentRequest;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ───────────────────────────────────────────
        // 1. Roles & Permissions
        // ───────────────────────────────────────────
        $this->call(RolePermissionSeeder::class);

        // ───────────────────────────────────────────
        // 2. Admin Account
        // ───────────────────────────────────────────
        $admin = User::updateOrCreate(
            ['email' => 'admin@inventory.local'],
            ['name' => 'Admin Account', 'password' => Hash::make('password')]
        );
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole && !$admin->roles()->where('role_id', $adminRole->id)->exists()) {
            $admin->roles()->attach($adminRole->id);
        }

        // ───────────────────────────────────────────
        // 3. Student Accounts
        // ───────────────────────────────────────────
        $studentRole = Role::where('name', 'student')->first();
        $studentsData = [
            ['name' => 'Benali Ahmed',      'email' => 'ahmed.benali@essa.tlemcen.dz'],
            ['name' => 'Khelifi Sara',       'email' => 'sara.khelifi@essa.tlemcen.dz'],
            ['name' => 'Medjdoub Yacine',    'email' => 'yacine.medjdoub@essa.tlemcen.dz'],
            ['name' => 'Boudiaf Amina',      'email' => 'amina.boudiaf@essa.tlemcen.dz'],
            ['name' => 'Haddad Mohamed',     'email' => 'mohamed.haddad@essa.tlemcen.dz'],
            ['name' => 'Ziani Fatima',       'email' => 'fatima.ziani@essa.tlemcen.dz'],
            ['name' => 'Belkacemi Karim',    'email' => 'karim.belkacemi@essa.tlemcen.dz'],
            ['name' => 'Mansouri Leila',     'email' => 'leila.mansouri@essa.tlemcen.dz'],
        ];

        $students = [];
        foreach ($studentsData as $sd) {
            $student = User::updateOrCreate(
                ['email' => $sd['email']],
                ['name' => $sd['name'], 'password' => Hash::make('password')]
            );
            if ($studentRole && !$student->roles()->where('role_id', $studentRole->id)->exists()) {
                $student->roles()->attach($studentRole->id);
            }
            $students[] = $student;
        }

        // ───────────────────────────────────────────
        // 4. Encadrants
        // ───────────────────────────────────────────
        $encadrantsData = [
            'Pr. Benahmed Khelifa',
            'Dr. Mokhtari Noureddine',
            'Pr. Belkhouche Fatima',
            'Dr. Zerhouni Abdelkader',
            'Dr. Hadjila Mounia',
        ];
        $encadrants = [];
        foreach ($encadrantsData as $nom) {
            $encadrants[] = Encadrant::firstOrCreate(['nom' => $nom]);
        }

        // ───────────────────────────────────────────
        // 5. Labos, Armoirs, Casiers
        // ───────────────────────────────────────────
        $lab03 = Labo::firstOrCreate(['nom' => 'LAB03'], ['description' => 'Laboratoire Electronique & Systèmes Embarqués']);
        $lab01 = Labo::firstOrCreate(['nom' => 'LAB01'], ['description' => 'Laboratoire Informatique & Réseaux']);

        // Armoir A_A in LAB03 (this matches the Excel data)
        $armA = Armoir::firstOrCreate(
            ['nom' => 'A_A', 'labo_id' => $lab03->id],
            ['barcode' => 'LAB03-A_A']
        );

        // Armoir B_A in LAB01
        $armB = Armoir::firstOrCreate(
            ['nom' => 'B_A', 'labo_id' => $lab01->id],
            ['barcode' => 'LAB01-B_A']
        );

        // Casier types
        $typeElec = CasierType::firstOrCreate(['nom' => 'Electronique']);
        $typeCapteur = CasierType::firstOrCreate(['nom' => 'Capteurs']);
        $typeInfo = CasierType::firstOrCreate(['nom' => 'Informatique']);

        // Casiers in Armoir A_A (casier 3 and casier 4 from the Excel)
        $casier3 = Casier::firstOrCreate(
            ['nom' => 'Casier 3', 'armoir_id' => $armA->id],
            ['barcode' => 'LAB03-A_A-C3', 'casier_type_id' => $typeElec->id]
        );
        $casier4 = Casier::firstOrCreate(
            ['nom' => 'Casier 4', 'armoir_id' => $armA->id],
            ['barcode' => 'LAB03-A_A-C4', 'casier_type_id' => $typeCapteur->id]
        );

        // Casiers in Armoir B_A
        $casierB1 = Casier::firstOrCreate(
            ['nom' => 'Casier 1', 'armoir_id' => $armB->id],
            ['barcode' => 'LAB01-B_A-C1', 'casier_type_id' => $typeInfo->id]
        );

        // ───────────────────────────────────────────
        // 6. Import Items from CSV
        // ───────────────────────────────────────────
        $csvPath = base_path('../docs/Exemple.csv');
        if (file_exists($csvPath)) {
            $this->command->info("Importing items from Exemple.csv...");
            $lines = array_map('str_getcsv', file($csvPath));
            // Skip header rows (first 2 lines are headers based on the file structure)
            // Actual data starts from line 8 (index 7) in the raw file but since multiline headers
            // get merged, let's parse smartly:
            foreach ($lines as $i => $row) {
                // Expecting: empty, N°, Fournisseur, Prix, Nom, Armoire, Casier, Type, Qty stock...
                // Skip if no N° or no Nom
                if (count($row) < 9) continue;
                $nInventaire = trim($row[1] ?? '');
                $fournisseurCode = trim($row[2] ?? '');
                $prix = trim($row[3] ?? '');
                $nom = trim($row[4] ?? '');
                $casierNum = trim($row[6] ?? '');
                $qteEnStock = intval(trim($row[8] ?? '0'));

                // Skip header/empty rows
                if (empty($nom) || !is_numeric($qteEnStock) || $qteEnStock <= 0) continue;
                if ($nom === 'Nom du Composant') continue;

                // Determine which casier
                $casier_id = null;
                if ($casierNum == '3') $casier_id = $casier3->id;
                elseif ($casierNum == '4') $casier_id = $casier4->id;

                Item::updateOrCreate(
                    ['nom' => $nom],
                    [
                        'n_inventaire'      => !empty($nInventaire) && is_numeric($nInventaire) ? $nInventaire : null,
                        'fournisseur_code'  => !empty($fournisseurCode) && $fournisseurCode !== 'DZD' ? $fournisseurCode : null,
                        'prix'              => !empty($prix) && is_numeric($prix) ? floatval($prix) : null,
                        'quantite_en_stock' => $qteEnStock,
                        'quantite_en_projet' => 0,
                        'quantite_perdue'   => 0,
                        'quantite_endommagee' => 0,
                        'casier_id'         => $casier_id,
                        'barcode'           => !empty($nInventaire) && is_numeric($nInventaire) ? 'ITEM-' . $nInventaire : null,
                    ]
                );
            }
            $this->command->info("CSV import done. " . Item::count() . " items in DB.");
        } else {
            $this->command->warn("CSV file not found at $csvPath — adding sample items manually.");
        }

        // ───────────────────────────────────────────
        // 7. Extra Items for LAB01 to make it richer
        // ───────────────────────────────────────────
        $extraItems = [
            ['nom' => 'Raspberry Pi 4 Model B',     'qte' => 5,  'prix' => 8500],
            ['nom' => 'Arduino Uno Rev3',            'qte' => 12, 'prix' => 1200],
            ['nom' => 'ESP32 DevKit V1',             'qte' => 18, 'prix' => 900],
            ['nom' => 'Breadboard 830 points',       'qte' => 25, 'prix' => 300],
            ['nom' => 'Kit fils Dupont M/M 40pcs',   'qte' => 20, 'prix' => 200],
            ['nom' => 'LED 5mm Assortiment (100pcs)', 'qte' => 8, 'prix' => 350],
            ['nom' => 'Résistances Kit 1/4W (600pcs)', 'qte' => 6, 'prix' => 500],
            ['nom' => 'Servomoteur SG90',            'qte' => 15, 'prix' => 450],
            ['nom' => 'Moteur DC 3-6V',              'qte' => 10, 'prix' => 250],
            ['nom' => 'Module Relais 4 Canaux',      'qte' => 7,  'prix' => 800],
            ['nom' => 'Écran LCD 16x2 I2C',          'qte' => 9,  'prix' => 750],
            ['nom' => 'Écran OLED 0.96" I2C',        'qte' => 6,  'prix' => 650],
            ['nom' => 'Capteur DHT22 Température/Humidité', 'qte' => 14, 'prix' => 600],
            ['nom' => 'Module GPS NEO-6M',           'qte' => 4,  'prix' => 1800],
            ['nom' => 'Caméra OV7670',               'qte' => 3,  'prix' => 400],
        ];

        foreach ($extraItems as $ei) {
            Item::firstOrCreate(
                ['nom' => $ei['nom']],
                [
                    'quantite_en_stock'  => $ei['qte'],
                    'prix'               => $ei['prix'],
                    'casier_id'          => $casierB1->id,
                    'barcode'            => 'EXT-' . strtoupper(substr(md5($ei['nom']), 0, 8)),
                ]
            );
        }

        // ───────────────────────────────────────────
        // 8. Projects
        // ───────────────────────────────────────────
        $proj1 = Project::firstOrCreate(
            ['titre' => 'Robot Suiveur de Ligne Autonome'],
            ['type' => 'PFE', 'annee_enseignement' => '2025/2026', 'encadrant_id' => $encadrants[0]->id, 'status' => 'active']
        );
        $proj1->users()->syncWithoutDetaching([$students[0]->id, $students[1]->id]);

        $proj2 = Project::firstOrCreate(
            ['titre' => 'Station Météo IoT avec ESP32'],
            ['type' => 'PFE', 'annee_enseignement' => '2025/2026', 'encadrant_id' => $encadrants[1]->id, 'status' => 'active']
        );
        $proj2->users()->syncWithoutDetaching([$students[2]->id, $students[3]->id]);

        $proj3 = Project::firstOrCreate(
            ['titre' => 'Contrôle Domotique par Bluetooth'],
            ['type' => 'Mini projet', 'annee_enseignement' => '2025/2026', 'encadrant_id' => $encadrants[2]->id, 'status' => 'active']
        );
        $proj3->users()->syncWithoutDetaching([$students[4]->id, $students[5]->id]);

        $proj4 = Project::firstOrCreate(
            ['titre' => 'Système d\'Irrigation Intelligent'],
            ['type' => 'PFE', 'annee_enseignement' => '2024/2025', 'encadrant_id' => $encadrants[3]->id, 'status' => 'terminé']
        );
        $proj4->users()->syncWithoutDetaching([$students[6]->id, $students[7]->id]);

        $proj5 = Project::firstOrCreate(
            ['titre' => 'Bras Robotique 4 Axes'],
            ['type' => 'Activités scientifiques', 'annee_enseignement' => '2025/2026', 'encadrant_id' => $encadrants[4]->id, 'status' => 'active']
        );
        $proj5->users()->syncWithoutDetaching([$students[0]->id, $students[4]->id]);

        // ───────────────────────────────────────────
        // 9. Assign items to projects (+ decrease stock)
        // ───────────────────────────────────────────
        $this->assignItem($proj1, 'Arduino Uno Rev3', 2);
        $this->assignItem($proj1, 'Servomoteur SG90', 4);
        $this->assignItem($proj1, 'Breadboard 830 points', 1);
        $this->assignItem($proj1, 'Capteur DHT22 Température/Humidité', 1);

        $this->assignItem($proj2, 'ESP32 DevKit V1', 2);
        $this->assignItem($proj2, 'Capteur DHT22 Température/Humidité', 2);
        $this->assignItem($proj2, 'Écran OLED 0.96" I2C', 1);
        $this->assignItem($proj2, 'Module GPS NEO-6M', 1);

        $this->assignItem($proj3, 'Arduino Uno Rev3', 1);
        $this->assignItem($proj3, 'Module Relais 4 Canaux', 2);
        $this->assignItem($proj3, 'Breadboard 830 points', 1);

        $this->assignItem($proj5, 'Servomoteur SG90', 4);
        $this->assignItem($proj5, 'Arduino Uno Rev3', 1);

        // Mark some items as lost/damaged for the terminated project
        $proj4Items = Item::where('nom', 'Raspberry Pi 4 Model B')->first();
        if ($proj4Items) {
            $proj4->items()->syncWithoutDetaching([$proj4Items->id => ['quantite' => 1]]);
            $proj4Items->decrement('quantite_en_stock', 1);
            $proj4Items->increment('quantite_perdue', 1);
        }
        $proj4Led = Item::where('nom', 'LED 5mm Assortiment (100pcs)')->first();
        if ($proj4Led) {
            $proj4->items()->syncWithoutDetaching([$proj4Led->id => ['quantite' => 2]]);
            $proj4Led->decrement('quantite_en_stock', 2);
            $proj4Led->increment('quantite_endommagee', 1);
            $proj4Led->increment('quantite_en_projet', 1);
        }

        // ───────────────────────────────────────────
        // 10. Component Requests
        // ───────────────────────────────────────────
        ComponentRequest::firstOrCreate(
            ['user_id' => $students[0]->id, 'nom_composant' => 'Capteur de Flamme IR'],
            ['quantite' => 3, 'status' => 'pending']
        );
        ComponentRequest::firstOrCreate(
            ['user_id' => $students[2]->id, 'nom_composant' => 'Module NRF24L01+'],
            ['quantite' => 2, 'status' => 'approved']
        );
        ComponentRequest::firstOrCreate(
            ['user_id' => $students[4]->id, 'nom_composant' => 'Potentiomètre 10K'],
            ['quantite' => 5, 'status' => 'pending']
        );
        ComponentRequest::firstOrCreate(
            ['user_id' => $students[1]->id, 'nom_composant' => 'Régulateur LM7805'],
            ['quantite' => 4, 'status' => 'rejected']
        );
        ComponentRequest::firstOrCreate(
            ['user_id' => $students[5]->id, 'nom_composant' => 'Transistor NPN 2N2222'],
            ['quantite' => 10, 'status' => 'pending']
        );
        ComponentRequest::firstOrCreate(
            ['user_id' => $students[6]->id, 'nom_composant' => 'Shield Motor L293D'],
            ['quantite' => 1, 'status' => 'approved']
        );

        $this->command->info('✅ Seeding completed successfully!');
        $this->command->info("   → {$admin->name} (admin@inventory.local / password)");
        $this->command->info("   → " . count($students) . " student accounts (password: password)");
        $this->command->info("   → " . Item::count() . " articles");
        $this->command->info("   → " . Project::count() . " projects");
        $this->command->info("   → " . Encadrant::count() . " encadrants");
        $this->command->info("   → " . ComponentRequest::count() . " component requests");
    }

    private function assignItem(Project $project, string $itemName, int $qte): void
    {
        $item = Item::where('nom', $itemName)->first();
        if (!$item || $item->quantite_en_stock < $qte) return;

        if (!$project->items()->where('item_id', $item->id)->exists()) {
            $project->items()->attach($item->id, ['quantite' => $qte]);
            $item->decrement('quantite_en_stock', $qte);
            $item->increment('quantite_en_projet', $qte);
        }
    }
}
