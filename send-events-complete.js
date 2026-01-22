// ============================================
// SCRIPT POUR ENVOYER L'OBJET COMPLET AVEC "EVENTS"
// ============================================

const amqp = require('amqplib');
const fs = require('fs');
require('dotenv').config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = process.env.QUEUE_NAME;

// Vérifier la configuration
if (!RABBITMQ_URL) {
  console.error('❌ Erreur: RABBITMQ_URL n\'est pas défini dans le fichier .env');
  process.exit(1);
}

if (!QUEUE_NAME) {
  console.error('❌ Erreur: QUEUE_NAME n\'est pas défini dans le fichier .env');
  process.exit(1);
}

// ============================================
// FONCTION PRINCIPALE
// ============================================
async function main() {
  let connection = null;
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 Envoi de l\'objet complet à RabbitMQ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Lire le fichier JSON
    console.log('📂 Lecture du fichier camera-events.json...');
    
    // Invalider le cache pour lire la dernière version
    delete require.cache[require.resolve('./camera-events.json')];
    const data = require('./camera-events.json');
    
    console.log('✅ Fichier chargé\n');
    
    // Se connecter à RabbitMQ
    console.log('🔌 Connexion à RabbitMQ...');
    console.log(`📋 Queue: "${QUEUE_NAME}"\n`);
    connection = await amqp.connect(RABBITMQ_URL);
    
    const channel = await connection.createChannel();
    
    // S'assurer que la queue existe
    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });
    
    console.log('✅ Connexion établie\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Créer l'objet complet à envoyer
    const objetComplet = {
      events: data.events
    };
    
    // Convertir en JSON
    const messageJson = JSON.stringify(objetComplet, null, 2);
    
    // Afficher l'objet complet
    console.log('📦 OBJET COMPLET ENVOYÉ À RABBITMQ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(messageJson);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Envoyer à RabbitMQ
    const envoye = channel.sendToQueue(QUEUE_NAME, Buffer.from(messageJson), {
      persistent: true
    });
    
    if (envoye) {
      console.log('✅ Objet envoyé avec succès!\n');
      console.log('📊 INFORMATIONS:');
      console.log(`   📏 Nombre d'événements: ${data.events.length}`);
      console.log(`   📐 Taille du message: ${Buffer.from(messageJson).length} bytes`);
      console.log(`   📝 Format: JSON avec structure "events"`);
      console.log(`   🎯 Queue: ${QUEUE_NAME}`);
      
      // Afficher les détails de chaque événement
      console.log('\n📋 DÉTAILS DES ÉVÉNEMENTS:');
      data.events.forEach((event, index) => {
        console.log(`\n   Événement ${index + 1}:`);
        console.log(`   📷 Camera: ${event.camera_id}`);
        console.log(`   🎯 Zone: ${event.zone_id}`);
        console.log(`   📊 Count: ${event.count}`);
        console.log(`   ⏰ Timestamp: ${event.timestamp}`);
      });
    } else {
      console.log('⚠️  L\'objet n\'a pas pu être envoyé');
    }
    
    // Fermer le canal
    await channel.close();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Envoi terminé avec succès!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Une erreur s\'est produite:', error.message);
    if (error.code === 'ENOENT') {
      console.error('   Le fichier camera-events.json n\'a pas été trouvé');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Connexion fermée\n');
    }
  }
}

// Lancer le script
if (require.main === module) {
  main();
}

module.exports = { main };

