/**
 * Utility classes Tailwind pour Valeur Delivery
 */
export const tailwindClasses = {
  // Buttons
  btn: {
    primary: 'bg-gray-900 text-white hover:bg-red-800 focus:ring-2 focus:ring-primary-red focus:ring-offset-2 px-4 py-2 rounded-md font-medium transition-colors',
    // secondary: 'bg-dark text-black hover:bg-gray-900 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 px-4 py-2 rounded-md font-medium transition-colors',
    secondary: 'bg-gray-900 text-white hover:bg-black focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 px-4 py-2 rounded-md font-medium transition-colors',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-4 py-2 rounded-md font-medium transition-colors',
    outline: 'border-2 border-primary-red text-primary-red hover:bg-black hover:text-white px-4 py-2 rounded-md font-medium transition-colors',
    link: 'text-primary-red hover:text-primary-red-dark underline px-4 py-2 rounded-md font-medium transition-colors',
  },
  
  // Badges
  badge: {
    status: {
      pending: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold',
      assigned: 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold',
      picked: 'bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold',
      delivering: 'bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-semibold',
      delivered: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold',
      returned: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold',
      stocked: 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold',
    },
  },
  
  // Cards
  card: 'bg-white rounded-lg shadow-md p-6 border border-gray-200',
  cardHeader: 'border-b border-gray-200 pb-4 mb-4',
  cardTitle: 'text-xl font-bold text-black',
  
  // Inputs
  input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent',
  textarea: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent resize-vertical',
  select: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent bg-white',
  
  // Tables
  table: 'min-w-full divide-y divide-gray-200',
  tableHeader: 'bg-gray-50',
  tableHeaderCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  tableBody: 'bg-white divide-y divide-gray-200',
  tableCell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
  
  // Layout
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  pageTitle: 'text-3xl font-bold text-black mb-6',
  sectionTitle: 'text-xl font-semibold text-black mb-4',
};

