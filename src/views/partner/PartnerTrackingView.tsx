import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/OrderService';
import { partnerTrackingService } from '../../services/PartnerTrackingService';
import type { Order } from '../../models/Order';
import type { Courier } from '../../services/CourierService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Pagination, { type PaginationMeta } from '../../components/common/Pagination';
import CouriersMap from '../../components/assignments/CouriersMap';
import { formatCurrency } from '../../utils/formatters';

type SectionKey = 'assigned' | 'delivering' | 'picked' | 'delivered' | 'map';

const SECTIONS: { key: SectionKey; label: string; status: Order['status'] }[] = [
  { key: 'assigned', label: 'Commandes attribuées', status: 'assigned' },
  { key: 'delivering', label: 'Commandes en cours de livraison', status: 'delivering' },
  { key: 'picked', label: 'Commandes récupérées', status: 'picked' },
  { key: 'delivered', label: 'Commandes livrées', status: 'delivered' },
];

const PER_PAGE = 10;

export default function PartnerTrackingView() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    assigned: true,
    delivering: true,
    picked: false,
    delivered: false,
    map: true,
  });
  const [ordersBySection, setOrdersBySection] = useState<Record<SectionKey, Order[]>>({
    assigned: [],
    delivering: [],
    picked: [],
    delivered: [],
    map: [],
  });
  const [paginationBySection, setPaginationBySection] = useState<Record<SectionKey, PaginationMeta>>({
    assigned: { current_page: 1, per_page: PER_PAGE, total: 0 },
    delivering: { current_page: 1, per_page: PER_PAGE, total: 0 },
    picked: { current_page: 1, per_page: PER_PAGE, total: 0 },
    delivered: { current_page: 1, per_page: PER_PAGE, total: 0 },
    map: { current_page: 1, per_page: 10, total: 0 },
  });
  const [loadingBySection, setLoadingBySection] = useState<Record<SectionKey, boolean>>({
    assigned: false,
    delivering: false,
    picked: false,
    delivered: false,
    map: false,
  });
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [dateFilter, setDateFilter] = useState<{ start_date: string; end_date: string }>({ start_date: '', end_date: '' });
  const routeViewLoggedRef = useRef(false);

  const loadOrders = useCallback(
    async (sectionKey: SectionKey, page: number = 1) => {
      const section = SECTIONS.find((s) => s.key === sectionKey);
      if (!section || section.key === 'map') return;

      setLoadingBySection((prev) => ({ ...prev, [sectionKey]: true }));
      try {
        const params: Parameters<typeof orderService.getAll>[0] = {
          status: section.status,
          page,
          per_page: PER_PAGE,
        };
        if (dateFilter.start_date) params.start_date = dateFilter.start_date;
        if (dateFilter.end_date) params.end_date = dateFilter.end_date;

        const res = await orderService.getAll(params);
        setOrdersBySection((prev) => ({ ...prev, [sectionKey]: res.data || [] }));
        if (res.meta) {
          setPaginationBySection((prev) => ({
            ...prev,
            [sectionKey]: { ...prev[sectionKey], ...res.meta, current_page: page },
          }));
        }
      } catch (e) {
        console.error('Error loading orders:', e);
      } finally {
        setLoadingBySection((prev) => ({ ...prev, [sectionKey]: false }));
      }
    },
    [dateFilter.start_date, dateFilter.end_date]
  );

  const loadCouriers = useCallback(async () => {
    try {
      const res = await partnerTrackingService.getCouriers();
      setCouriers(res.data || []);
      setAssignmentCounts(res.assignment_counts || {});
    } catch (e) {
      console.error('Error loading partner couriers:', e);
    }
  }, []);

  useEffect(() => {
    loadCouriers();
  }, [loadCouriers]);

  useEffect(() => {
    SECTIONS.forEach((s) => {
      if (s.key !== 'map' && openSections[s.key]) {
        loadOrders(s.key, paginationBySection[s.key].current_page);
      }
    });
  }, [openSections, dateFilter, loadOrders]);

  const handleSectionToggle = (key: SectionKey) => {
    const willOpen = !openSections[key];
    setOpenSections((prev) => ({ ...prev, [key]: willOpen }));
    if (key !== 'map' && willOpen) {
      loadOrders(key, 1);
    }
    if (key === 'map' && willOpen && !routeViewLoggedRef.current) {
      routeViewLoggedRef.current = true;
      partnerTrackingService.logRouteView().catch(() => {});
    }
  };

  const handlePageChange = (sectionKey: SectionKey, page: number) => {
    setPaginationBySection((prev) => ({ ...prev, [sectionKey]: { ...prev[sectionKey], current_page: page } }));
    loadOrders(sectionKey, page);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Suivi des livraisons</h1>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-800">Filtre par date</label>
          <input
            type="date"
            value={dateFilter.start_date}
            onChange={(e) => setDateFilter((prev) => ({ ...prev, start_date: e.target.value }))}
            className="rounded border border-gray-300 dark:border-gray-600 bg-white  px-3 py-2 text-sm"
          />
          <span className="text-gray-500">à</span>
          <input
            type="date"
            value={dateFilter.end_date}
            onChange={(e) => setDateFilter((prev) => ({ ...prev, end_date: e.target.value }))}
            className="rounded border border-gray-300 dark:border-gray-600 bg-white  px-3 py-2 text-sm"
          />
        </div>
      </Card>

      {SECTIONS.map(({ key, label, status }) => (
        <Card key={key} className="overflow-hidden">
          <button
            type="button"
            onClick={() => handleSectionToggle(key)}
            className="w-full flex items-center justify-between p-4 text-left cursor-pointer transition-colors"
          >
            <span className="font-semibold text-gray-900 ">{label}</span>
            <span className="text-red-500">
              {openSections[key] ? '▼' : '▶'} {paginationBySection[key]?.total != null && `(${paginationBySection[key].total})`}
            </span>
          </button>
          {openSections[key] && (
            <div className="border-t border-gray-200  p-4">
              {loadingBySection[key] ? (
                <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {(ordersBySection[key] || []).map((order) => (
                      <li
                        key={order.uuid}
                        className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-blue-500"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 ">{order.order_number}</span>
                          <span className="mx-2 text-gray-400">·</span>
                          <span className="text-gray-600 dark:text-gray-600">{order.customer_name}</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{order.delivery_address}</p>
                          {order.total_amount != null && (
                            <p className="text-sm text-gray-600 dark:text-red-500 mt-1">{formatCurrency(order.total_amount)}</p>
                          )}
                        </div>
                        <Badge status={order.status} />
                        <button
                          type="button"
                          onClick={() => navigate(`/orders/${order.uuid}`)}
                          className="text-sm text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                        >
                          Voir
                        </button>
                      </li>
                    ))}
                  </ul>
                  {(!ordersBySection[key] || ordersBySection[key].length === 0) && !loadingBySection[key] && (
                    <p className="text-gray-500 dark:text-gray-400 py-4">Aucune commande</p>
                  )}
                  {paginationBySection[key] && paginationBySection[key].total > PER_PAGE && (
                    <div className="mt-4">
                      <Pagination
                        meta={paginationBySection[key]}
                        onPageChange={(page) => handlePageChange(key, page)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Card>
      ))}

      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => handleSectionToggle('map')}
          className="w-full flex items-center justify-between p-4 text-left cursor-pointer  transition-colors"
        >
          <span className="font-semibold text-gray-900 ">Carte de suivi temps réel</span>
          <span className="text-gray-500 dark:text-gray-400">{openSections.map ? '▼' : '▶'}</span>
        </button>
        {openSections.map && (
          <div className="border-t border-gray-200  p-4">
            <CouriersMap
              couriers={couriers}
              assignmentCounts={assignmentCounts}
              autoRefresh
              refreshInterval={15000}
              onCouriersUpdate={(updated) => {
                setCouriers(updated);
                loadCouriers();
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
