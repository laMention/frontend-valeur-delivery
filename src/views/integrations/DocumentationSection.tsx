import { useState } from 'react';

interface DocumentationSectionProps {
  apiKey?: string;
}

export default function DocumentationSection({ apiKey }: DocumentationSectionProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    steps: true,
    authentication: false,
    endpoint: false,
    responses: false,
    examples: false,
    bestPractices: false,
    webhook: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600 dark:text-gray-400">
        Utilisez ces clés pour intégrer votre marketplace avec l'API Valeur Delivery.
      </p>

      {/* Vue d'ensemble */}
      <Section
        title="📖 Vue d'ensemble"
        isExpanded={expandedSections.overview}
        onToggle={() => toggleSection('overview')}
      >
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            L'API d'intégration marketplace permet aux plateformes e-commerce (WooCommerce, PrestaShop, Shopify, etc.) d'enregistrer automatiquement des commandes de livraison dans Valeur Delivery.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>✨ Fonctionnalités principales :</strong>
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>Idempotence : évite les doublons de commandes</li>
              <li>Adresse de récupération (pickup) obligatoire pour le calcul des frais</li>
              <li>Calcul automatique des frais de livraison par Valeur Delivery (distance, zone, véhicule)</li>
              <li>Détermination automatique de la zone de livraison</li>
              <li>Création automatique des partenaires</li>
            </ul>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300 font-medium">
              ⚠️ Ne jamais envoyer de montant de livraison : les frais sont toujours calculés côté Valeur Delivery.
            </p>
          </div>
        </div>
      </Section>

      {/* Étapes d'intégration */}
      <Section
        title="📋 Étapes d'intégration"
        isExpanded={expandedSections.steps}
        onToggle={() => toggleSection('steps')}
      >
        <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Obtenir une clé API</strong> (cette page) et la configurer côté marketplace (WooCommerce, PrestaShop, etc.).
          </li>
          <li>
            <strong>Configurer l'adresse de récupération (pickup)</strong> : adresse + latitude + longitude obligatoires pour le calcul des frais.
          </li>
          <li>
            <strong>À chaque nouvelle commande</strong> : envoyer un POST avec <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">external_order_id</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">partner</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">customer</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">pickup</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">delivery</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">order.order_number</code> (et optionnellement items, weight, etc.). <strong>Ne pas envoyer de montant de livraison.</strong>
          </li>
          <li>
            <strong>Récupérer la réponse</strong> : <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">delivery_fees</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">order_uuid</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">order_number</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">currency</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">vehicle_type</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">distance_km</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">estimated_time_minutes</code>.
          </li>
          <li>
            <strong>Idempotence</strong> : réutiliser le même <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">external_order_id</code> pour une même commande ; l'API retourne la commande existante sans doublon.
          </li>
        </ol>
      </Section>

      {/* Authentification */}
      <Section
        title="🔐 Authentification"
        isExpanded={expandedSections.authentication}
        onToggle={() => toggleSection('authentication')}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Méthode 1 : Header X-API-Key (Recommandé)
            </h4>
            <CodeBlock
              code={`POST /api/integrations/marketplace/orders
X-API-Key: ${apiKey || 'vd_votre_cle_api_ici'}
Content-Type: application/json`}
              language="http"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Méthode 2 : Header Authorization Bearer
            </h4>
            <CodeBlock
              code={`POST /api/integrations/marketplace/orders
Authorization: Bearer ${apiKey || 'vd_votre_cle_api_ici'}
Content-Type: application/json`}
              language="http"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Méthode 3 : Body (moins sécurisé)
            </h4>
            <CodeBlock
              code={`{
  "api_key": "${apiKey || 'vd_votre_cle_api_ici'}",
  "api_secret": "votre_secret_ici", // Optionnel
  ...
}`}
              language="json"
            />
          </div>
        </div>
      </Section>

      {/* Endpoint et Payload */}
      <Section
        title="📡 Endpoint et Payload"
        isExpanded={expandedSections.endpoint}
        onToggle={() => toggleSection('endpoint')}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Endpoint
            </h4>
            <CodeBlock code="POST /api/integrations/marketplace/orders" language="http" />
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Structure du Payload
            </h4>
            <CodeBlock
              code={`{
  "external_order_id": "WC-102554",
  "marketplace": "woocommerce",
  "partner": {
    "name": "Guianou",
    "email": "contact@guianou.com",
    "phone": "+22507000000"
  },
  "customer": {
    "name": "Jean Dupont",
    "phone": "+22505000000",
    "email": "jean@gmail.com"
  },
  "pickup": {
    "address": "Riviera Palmeraie, Abidjan",
    "latitude": 5.38317,
    "longitude": -3.94524
  },
  "delivery": {
    "address": "Cocody Angré, Abidjan",
    "latitude": 5.36194,
    "longitude": -3.98765
  },
  "order": {
    "order_number": "WC-102554",
    "reserved_at": "2025-01-20 10:30:00",
    "weight": 0.1,
    "is_express": false,
    "items": [
      {
        "name": "Chaussures",
        "quantity": 1,
        "price": 15000
      }
    ],
    "total_order_amount": 15000
  }
}`}
              language="json"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important :</strong> Les frais de livraison ne doivent <strong>jamais</strong> être envoyés par la marketplace.
              Ils sont calculés automatiquement à partir de <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">pickup</code> et <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">delivery</code> (distance, zone, type de véhicule).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                ✅ Champs requis
              </h5>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• external_order_id</li>
                <li>• partner.name</li>
                <li>• customer.name</li>
                <li>• customer.phone</li>
                <li>• <strong>pickup.address</strong></li>
                <li>• <strong>pickup.latitude</strong></li>
                <li>• <strong>pickup.longitude</strong></li>
                <li>• delivery.address</li>
                <li>• order.order_number</li>
              </ul>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                delivery.latitude/longitude requis si delivery.address absent (sinon géocodage).
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Champs optionnels
              </h5>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• marketplace</li>
                <li>• partner.email / phone</li>
                <li>• customer.email</li>
                <li>• delivery.latitude / longitude</li>
                <li>• order.reserved_at</li>
                <li>• order.weight (défaut: 0.1)</li>
                <li>• order.is_express</li>
                <li>• order.items</li>
                <li>• order.total_order_amount</li>
              </ul>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                ❌ order.delivery_amount n'existe pas : ne pas l'envoyer.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Réponses */}
      <Section
        title="📥 Réponses API"
        isExpanded={expandedSections.responses}
        onToggle={() => toggleSection('responses')}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
              ✅ Succès (201 Created)
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              La réponse contient les frais de livraison calculés par Valeur Delivery.
            </p>
            <CodeBlock
              code={`{
  "success": true,
  "message": "Commande enregistrée avec succès",
  "order_uuid": "uuid-de-la-commande",
  "order_number": "CMD-12345",
  "delivery_fees": 2500,
  "currency": "XOF",
  "vehicle_type": "moto",
  "distance_km": 7.2,
  "estimated_time_minutes": 35,
  "status": "pending"
}`}
              language="json"
            />
            <ul className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
              <li>• delivery_fees : frais calculés (XOF)</li>
              <li>• vehicle_type : moto, voiture ou velo</li>
              <li>• distance_km / estimated_time_minutes : pour information</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
              ℹ️ Commande déjà existante (200 OK)
            </h4>
            <CodeBlock
              code={`{
  "success": true,
  "message": "Commande déjà existante",
  "order_uuid": "uuid-de-la-commande-existante",
  "order_number": "CMD-12345",
  "delivery_fees": 2500,
  "currency": "XOF",
  "vehicle_type": "moto",
  "distance_km": 7.2,
  "estimated_time_minutes": 35,
  "status": "pending"
}`}
              language="json"
            />
          </div>

          <div>
            <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">
              ❌ Erreur de validation (422)
            </h4>
            <CodeBlock
              code={`{
  "success": false,
  "message": "Données invalides",
  "errors": {
    "customer.name": ["Le champ customer.name est requis."],
    "delivery.latitude": ["Le champ delivery.latitude doit être un nombre entre -90 et 90."]
  }
}`}
              language="json"
            />
          </div>

          <div>
            <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">
              🔒 Erreur d'authentification (401)
            </h4>
            <CodeBlock
              code={`{
  "success": false,
  "message": "Clé API invalide ou désactivée."
}`}
              language="json"
            />
          </div>
        </div>
      </Section>

      {/* Exemples d'intégration */}
      <Section
        title="💻 Exemples d'intégration"
        isExpanded={expandedSections.examples}
        onToggle={() => toggleSection('examples')}
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              WooCommerce (PHP)
            </h4>
            <CodeBlock
              code={`<?php
function send_order_to_valeur_delivery($order) {
    $api_key = '${apiKey || 'vd_votre_cle_api'}';
    $api_url = 'https://api.valeurdelivery.com/api/integrations/marketplace/orders';
    
    // Pickup obligatoire : adresse de récupération du colis (coordonnées requises)
    $pickup_lat = (float) get_option('vd_pickup_latitude', 5.36);
    $pickup_lng = (float) get_option('vd_pickup_longitude', -4.01);
    
    $payload = [
        'external_order_id' => 'WC-' . $order->get_id(),
        'marketplace' => 'woocommerce',
        'partner' => [
            'name' => get_bloginfo('name'),
            'email' => get_option('admin_email'),
        ],
        'customer' => [
            'name' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            'phone' => $order->get_billing_phone(),
            'email' => $order->get_billing_email(),
        ],
        'pickup' => [
            'address' => get_option('vd_pickup_address', 'Entrepôt principal, Abidjan'),
            'latitude' => $pickup_lat,
            'longitude' => $pickup_lng,
        ],
        'delivery' => [
            'address' => $order->get_shipping_address_1(),
            'latitude' => get_post_meta($order->get_id(), '_shipping_latitude', true),
            'longitude' => get_post_meta($order->get_id(), '_shipping_longitude', true),
        ],
        'order' => [
            'order_number' => 'WC-' . $order->get_id(),
            'weight' => 0.5,
            'total_order_amount' => $order->get_total(),
            'items' => array_map(function ($item) {
                return [
                    'name' => $item->get_name(),
                    'quantity' => $item->get_quantity(),
                    'price' => $item->get_total(),
                ];
            }, $order->get_items()),
        ],
    ];
    
    $response = wp_remote_post($api_url, [
        'headers' => [
            'X-API-Key' => $api_key,
            'Content-Type' => 'application/json',
        ],
        'body' => json_encode($payload),
        'timeout' => 30,
    ]);
    
    if (is_wp_error($response)) {
        error_log('Erreur Valeur Delivery: ' . $response->get_error_message());
        return false;
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    // $body['delivery_fees'] contient les frais calculés par Valeur Delivery
    return $body['success'] ?? false;
}`}
              language="php"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              PrestaShop (PHP)
            </h4>
            <CodeBlock
              code={`<?php
function sendOrderToValeurDelivery($order) {
    $apiKey = Configuration::get('VALEUR_DELIVERY_API_KEY');
    $apiUrl = 'https://api.valeurdelivery.com/api/integrations/marketplace/orders';
    
    $address = new Address($order->id_address_delivery);
    $customer = new Customer($order->id_customer);
    
    // Pickup obligatoire : adresse de récupération (coordonnées requises)
    $payload = [
        'external_order_id' => 'PS-' . $order->id,
        'marketplace' => 'prestashop',
        'partner' => [
            'name' => Configuration::get('PS_SHOP_NAME'),
            'email' => Configuration::get('PS_SHOP_EMAIL'),
        ],
        'customer' => [
            'name' => $customer->firstname . ' ' . $customer->lastname,
            'phone' => $address->phone,
            'email' => $customer->email,
        ],
        'pickup' => [
            'address' => Configuration::get('VALEUR_DELIVERY_PICKUP_ADDRESS', 'Entrepôt, Abidjan'),
            'latitude' => (float) Configuration::get('VALEUR_DELIVERY_PICKUP_LAT', 5.36),
            'longitude' => (float) Configuration::get('VALEUR_DELIVERY_PICKUP_LNG', -4.01),
        ],
        'delivery' => [
            'address' => $address->address1 . ', ' . $address->city,
            'latitude' => $address->latitude ?? null,
            'longitude' => $address->longitude ?? null,
        ],
        'order' => [
            'order_number' => 'PS-' . $order->id,
            'weight' => $order->getTotalWeight(),
            'total_order_amount' => $order->total_paid,
        ],
    ];
    
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: ' . $apiKey,
        'Content-Type: application/json',
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ($httpCode === 201 || $httpCode === 200);
}`}
              language="php"
            />
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              JavaScript/Node.js
            </h4>
            <CodeBlock
              code={`const axios = require('axios');

async function sendOrderToValeurDelivery(orderData) {
    const apiKey = process.env.VALEUR_DELIVERY_API_KEY;
    const apiUrl = 'https://api.valeurdelivery.com/api/integrations/marketplace/orders';
    
    try {
        const response = await axios.post(apiUrl, orderData, {
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
        
        return response.data;
    } catch (error) {
        console.error('Erreur Valeur Delivery:', error.response?.data || error.message);
        throw error;
    }
}

// Exemple d'utilisation (pickup obligatoire ; pas de delivery_amount)
const orderData = {
    external_order_id: 'SHOP-' + Date.now(),
    marketplace: 'custom',
    partner: {
        name: 'Mon E-commerce',
        email: 'contact@mon-ecommerce.com',
    },
    customer: {
        name: 'Jean Dupont',
        phone: '+22505000000',
        email: 'jean@example.com',
    },
    pickup: {
        address: 'Entrepôt principal, Abidjan',
        latitude: 5.36,
        longitude: -4.01,
    },
    delivery: {
        address: 'Riviera Palmeraie, Abidjan',
        latitude: 5.38317,
        longitude: -3.94524,
    },
    order: {
        order_number: 'SHOP-' + Date.now(),
        weight: 0.5,
        total_order_amount: 25000,
    },
};

sendOrderToValeurDelivery(orderData)
    .then(result => {
        console.log('Commande créée. Frais livraison:', result.delivery_fees, result.currency);
    })
    .catch(error => console.error('Erreur:', error));`}
              language="javascript"
            />
          </div>
        </div>
      </Section>

      {/* Bonnes pratiques */}
      <Section
        title="✨ Bonnes pratiques"
        isExpanded={expandedSections.bestPractices}
        onToggle={() => toggleSection('bestPractices')}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              1. Idempotence
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Utilisez toujours le même <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">external_order_id</code> pour une commande donnée. 
              L'API garantit l'idempotence et retournera la commande existante si elle existe déjà.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              2. Gestion des erreurs
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              Toujours vérifier le code HTTP et le champ <code className="bg-green-100 dark:bg-green-900 px-1 rounded">success</code> dans la réponse.
            </p>
            <CodeBlock
              code={`if ($httpCode === 201 || $httpCode === 200) {
    $result = json_decode($response, true);
    if ($result['success']) {
        // Succès
    } else {
        // Erreur métier
    }
} else {
    // Erreur HTTP
}`}
              language="php"
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              3. Retry en cas d'échec
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
              En cas d'erreur réseau, implémentez un mécanisme de retry avec backoff exponentiel.
            </p>
            <CodeBlock
              code={`$maxRetries = 3;
$retryDelay = 1; // secondes

for ($i = 0; $i < $maxRetries; $i++) {
    $response = sendOrderToValeurDelivery($order);
    if ($response['success']) {
        break;
    }
    sleep($retryDelay * pow(2, $i)); // Backoff exponentiel
}`}
              language="php"
            />
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              4. Pickup obligatoire et pas de montant livraison
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
              Pour le calcul automatique des frais, fournissez toujours <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">pickup.address</code>, <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">pickup.latitude</code> et <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">pickup.longitude</code>.
              Ne jamais envoyer <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">order.delivery_amount</code> : les frais sont calculés par Valeur Delivery et retournés dans la réponse (<code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">delivery_fees</code>).
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              5. Validation des coordonnées GPS
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Vérifiez que les coordonnées GPS sont valides avant l'envoi :
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-purple-700 dark:text-purple-300">
              <li>Latitude : -90 à 90</li>
              <li>Longitude : -180 à 180</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Webhook - Notifications de changement de statut */}
      <Section
        title="🔔 Webhook - Notifications de changement de statut"
        isExpanded={expandedSections.webhook}
        onToggle={() => toggleSection('webhook')}
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Configurez une URL webhook dans la section « Webhook / Intégration » pour recevoir automatiquement les notifications de changement de statut de vos commandes. Valeur Delivery envoie une requête HTTP POST vers votre URL à chaque mise à jour.
          </p>

          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
            Format des requêtes envoyées
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li><strong>Méthode :</strong> POST</li>
            <li><strong>Content-Type :</strong> application/json</li>
            <li><strong>Headers :</strong> User-Agent: ValeurDelivery-Webhook/1.0, X-Webhook-Event: order.status.updated</li>
          </ul>

          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-4">
            Événements envoyés
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            À chaque changement de statut d&apos;une commande (En attente → Assignée → En livraison → Livrée, etc.), le système envoie un payload JSON avec les informations de la commande.
          </p>

          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-4">
            Codes de statut
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Les champs <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">previous_status</code> et <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">current_status</code> utilisent les codes suivants :
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li><code>pending</code> — En attente</li>
            <li><code>assigned</code> — Assignée</li>
            <li><code>picked</code> — Collectée</li>
            <li><code>delivering</code> — En livraison</li>
            <li><code>delivered</code> — Livrée</li>
            <li><code>returned</code> — Retournée</li>
            <li><code>cancelled</code> — Annulée</li>
          </ul>

          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-4">
            Exemple de payload
          </h4>
          <CodeBlock
            code={`{
  "event": "order.status.updated",
  "order_id": "uuid-de-la-commande",
  "order_number": "ORD-12345",
  "previous_status": "assigned",
  "current_status": "delivering",
  "courier_id": "uuid-du-livreur",
  "updated_at": "2026-02-27T14:30:00Z"
}`}
            language="json"
          />

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Conseil :</strong> Votre endpoint doit répondre rapidement (HTTP 2xx) pour confirmer la réception. Valeur Delivery effectue jusqu&apos;à 3 tentatives en cas d&apos;échec.
            </p>
          </div>
        </div>
      </Section>

      {/* Support */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          📞 Support
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pour toute question ou problème :{' '}
          <a
            href="mailto:support@valeurdelivery.com"
            className="text-red-800 dark:text-red-400 hover:underline"
          >
            support@valeurdelivery.com
          </a>
        </p>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, isExpanded, onToggle, children }: SectionProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
      >
        <span className="font-semibold text-gray-800 dark:text-gray-200">{title}</span>
        <span className="text-gray-500 dark:text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-3 py-1 rounded-t-lg">
        <span className="text-xs font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="text-xs hover:text-white transition-colors"
        >
          {copied ? '✓ Copié' : '📋 Copier'}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
