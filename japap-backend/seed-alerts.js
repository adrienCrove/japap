const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAlerts() {
  try {
    // Supprimer les données existantes (optionnel)
    await prisma.alert.deleteMany();
    await prisma.user.deleteMany();
    
    // Créer des faux utilisateurs d'abord
    const adminUser = await prisma.user.create({
      data: {
        phone: '+237123456789',
        name: 'Admin Test',
        gender: 'male',
        role: 'admin',
        reputationScore: 95,
        location: {
          address: 'Centre-ville, Douala',
          coordinates: { lat: 4.0511, lng: 9.7679 }
        }
      }
    });
    
    const regularUser = await prisma.user.create({
      data: {
        phone: '+237987654321',
        name: 'Marie Kamdem',
        gender: 'female',
        role: 'user',
        reputationScore: 72,
        location: {
          address: 'Quartier Makepe, Douala',
          coordinates: { lat: 4.0614, lng: 9.7466 }
        }
      }
    });
    
    const moderatorUser = await prisma.user.create({
      data: {
        phone: '+237555123456',
        name: 'Paul Mbarga',
        gender: 'male',
        role: 'moderator',
        reputationScore: 88,
        location: {
          address: 'Bonanjo, Douala',
          coordinates: { lat: 4.0496, lng: 9.6913 }
        }
      }
    });
    
    console.log(`✅ Utilisateurs créés:`);
    console.log(`   - ${adminUser.name} (Admin, ID: ${adminUser.id})`);
    console.log(`   - ${regularUser.name} (User, ID: ${regularUser.id})`);
    console.log(`   - ${moderatorUser.name} (Moderator, ID: ${moderatorUser.id})`);
    
    // Créer des alertes de test avec différents utilisateurs
    const alerts = await prisma.alert.createMany({
      data: [
        {
          userId: adminUser.id,
          ref_alert_id: 'ALT/INC-001',
          title: 'Incendie dans un bâtiment commercial au centre-ville',
          displayTitle: 'Incendie dans un bâtiment commercial au centre-ville',
          category: 'Incendie',
          severity: 'critical',
          description: 'Incendie dans un bâtiment commercial au centre-ville',
          location: {
            address: '123 Rue de la Paix, Douala',
            coordinates: { lat: 4.0511, lng: 9.7679 }
          },
          mediaUrl: 'https://example.com/fire-photo.jpg',
          status: 'active'
        },
        {
          userId: regularUser.id,
          ref_alert_id: 'ALT/ACC-001',
          title: 'Collision entre deux véhicules sur l\'autoroute',
          displayTitle: 'Collision entre deux véhicules sur l\'autoroute',
          category: 'Accident',
          severity: 'high',
          description: 'Collision entre deux véhicules sur l\'autoroute',
          location: {
            address: 'Autoroute Douala-Yaoundé, Km 15',
            coordinates: { lat: 4.0383, lng: 9.7792 }
          },
          mediaUrl: 'https://example.com/accident-photo.jpg',
          status: 'active'
        },
        {
          userId: regularUser.id,
          ref_alert_id: 'ALT/INON-001',
          title: 'Inondation dans le quartier résidentiel après les pluies',
          displayTitle: 'Inondation dans le quartier résidentiel après les pluies',
          category: 'Inondation',
          severity: 'medium',
          description: 'Inondation dans le quartier résidentiel après les pluies',
          location: {
            address: 'Quartier Makepe, Douala',
            coordinates: { lat: 4.0614, lng: 9.7466 }
          },
          mediaUrl: '',
          status: 'pending'
        },
        {
          userId: moderatorUser.id,
          ref_alert_id: 'ALT/CAMB-001',
          title: 'Tentative de cambriolage signalée dans une résidence',
          displayTitle: 'Tentative de cambriolage signalée dans une résidence',
          category: 'Sécurité',
          severity: 'high',
          description: 'Tentative de cambriolage signalée dans une résidence',
          location: {
            address: '45 Avenue des Cocotiers, Bonanjo',
            coordinates: { lat: 4.0496, lng: 9.6913 }
          },
          mediaUrl: 'https://example.com/security-photo.jpg',
          status: 'active'
        },
        {
          userId: adminUser.id,
          ref_alert_id: 'ALT/ELEC-001',
          title: 'Coupure d\'électricité dans plusieurs rues',
          displayTitle: 'Coupure d\'électricité dans plusieurs rues',
          category: 'Infrastructure',
          severity: 'low',
          description: 'Coupure d\'électricité dans plusieurs rues',
          location: {
            address: 'Quartier Bonapriso, Douala',
            coordinates: { lat: 4.0642, lng: 9.6794 }
          },
          mediaUrl: '',
          status: 'resolved'
        }
      ]
    });
    
    console.log(`✅ ${alerts.count} alertes créées avec succès!`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des alertes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAlerts();