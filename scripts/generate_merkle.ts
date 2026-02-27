import { keccak256, encodePacked } from 'viem';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import fs from 'fs';

/**
 * To run this script:
 * 1. Install @openzeppelin/merkle-tree: npm install @openzeppelin/merkle-tree
 * 2. Place an 'approved_wallets.json' file in the same directory (array of strings)
 * 3. Run: npx ts-node generate_merkle.ts
 */

async function generate() {
    try {
        const rawData = fs.readFileSync('approved_wallets.json', 'utf8');
        const wallets = JSON.parse(rawData);

        // Deduplicate and normalize
        const values = [...new Set(wallets.map((w: string) => [w.toLowerCase()]))];

        const tree = StandardMerkleTree.of(values, ["address"]);

        console.log("Merkle Root:", tree.root);

        const result = {
            root: tree.root,
            tree: tree.dump()
        };

        fs.writeFileSync('merkle_data.json', JSON.stringify(result, null, 2));
        console.log("Merkle data saved to merkle_data.json");
    } catch (err: any) {
        console.error("Error generating Merkle tree:", err.message);
    }
}

generate();
