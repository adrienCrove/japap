#!/usr/bin/env node

/**
 * Script pour créer ou vérifier l'utilisateur de test pour Maestro
 * Usage: node scripts/create-test-user.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000/api';

// Credentials de l'utilisateur de test (synchronisé avec .maestro/config.yaml)
const TEST_USER = {
  email: 'maestro-test@japap.com',
  phone: '+237600000000',
  password: 'TestPassword123!',
  fullname: 'Maestro Test User',
  address: 'Yaoundé, Cameroun',
  interests: ['MEDC', 'ACCG', 'FIRV'], // Quelques catégories par défaut
};

/**
 * Vérifier si l'utilisateur existe déjà
 */
async function checkUserExists() {
  try {
    console.log(`🔍 Vérification de l'existence de l'utilisateur: ${TEST_USER.email}`);

    const response = await fetch(`${API_BASE_URL}/auth/check-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailOrPhone: TEST_USER.email,
      }),
    });

    const data = await response.json();

    if (data.success && data.exists) {
      console.log('✅ L\'utilisateur de test existe déjà');
      console.log(`   ID: ${data.user?.id}`);
      console.log(`   Nom: ${data.user?.name}`);
      console.log(`   Email: ${data.user?.email}`);
      console.log(`   Téléphone: ${data.user?.phone}`);
      return {
        exists: true,
        user: data.user,
      };
    }

    console.log('ℹ️  L\'utilisateur de test n\'existe pas encore');
    return {
      exists: false,
      user: null,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    return {
      exists: false,
      user: null,
      error: error.message,
    };
  }
}

/**
 * Créer l'utilisateur de test
 */
async function createTestUser() {
  try {
    console.log(`\n📝 Création de l'utilisateur de test...`);

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Utilisateur de test créé avec succès !');
      console.log(`   ID: ${data.user?.id}`);
      console.log(`   Nom: ${data.user?.name || TEST_USER.fullname}`);
      console.log(`   Email: ${TEST_USER.email}`);
      console.log(`   Téléphone: ${TEST_USER.phone}`);
      console.log(`   Token: ${data.token ? 'Généré' : 'Non disponible'}`);
      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } else {
      console.error('❌ Échec de la création:', data.error || data.message);
      return {
        success: false,
        error: data.error || data.message,
      };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Tester la connexion avec l'utilisateur de test
 */
async function testLogin() {
  try {
    console.log(`\n🔐 Test de connexion...`);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailOrPhone: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Connexion réussie !');
      console.log(`   Token: ${data.token ? 'Valide' : 'Non disponible'}`);
      return {
        success: true,
        token: data.token,
      };
    } else {
      console.error('❌ Échec de la connexion:', data.error || data.message);
      return {
        success: false,
        error: data.error || data.message,
      };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Script principal
 */
async function main() {
  console.log('🚀 Setup de l\'utilisateur de test Maestro\n');
  console.log(`📡 API Backend: ${API_BASE_URL}\n`);

  // Vérifier la connexion au backend
  try {
    const healthCheck = await fetch(`${API_BASE_URL.replace('/api', '')}/`);
    if (!healthCheck.ok) {
      console.error('❌ Le backend ne répond pas. Assurez-vous qu\'il est démarré.');
      console.error('   Commande: cd japap-backend && npm run dev');
      process.exit(1);
    }
    console.log('✅ Backend accessible\n');
  } catch (error) {
    console.error('❌ Impossible de se connecter au backend:', error.message);
    console.error('   Assurez-vous que le backend est démarré sur', API_BASE_URL);
    process.exit(1);
  }

  // Étape 1: Vérifier si l'utilisateur existe
  const checkResult = await checkUserExists();

  if (checkResult.error) {
    console.error('\n❌ Impossible de vérifier l\'utilisateur');
    process.exit(1);
  }

  // Étape 2: Créer l'utilisateur s'il n'existe pas
  if (!checkResult.exists) {
    const createResult = await createTestUser();

    if (!createResult.success) {
      console.error('\n❌ Impossible de créer l\'utilisateur de test');
      process.exit(1);
    }
  }

  // Étape 3: Tester la connexion
  const loginResult = await testLogin();

  if (!loginResult.success) {
    console.error('\n❌ La connexion a échoué');
    console.error('   Vérifiez que le mot de passe est correct');
    process.exit(1);
  }

  // Résumé
  console.log('\n' + '='.repeat(50));
  console.log('✅ Setup terminé avec succès !');
  console.log('='.repeat(50));
  console.log('\n📋 Credentials pour Maestro:');
  console.log(`   Email:     ${TEST_USER.email}`);
  console.log(`   Téléphone: ${TEST_USER.phone}`);
  console.log(`   Password:  ${TEST_USER.password}`);
  console.log('\n🎯 Vous pouvez maintenant lancer les tests Maestro:');
  console.log('   npm run test:e2e\n');
}

// Exécuter le script
main().catch((error) => {
  console.error('\n❌ Erreur fatale:', error.message);
  process.exit(1);
});
