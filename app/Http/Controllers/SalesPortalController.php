<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesPortalController extends Controller
{
    private function getInitialOrders()
    {
        return [
            [
                'id' => 'ORD-892-A1',
                'date_raised' => 'Oct 24, 2023',
                'customer_name' => 'Acme Corporation Ltd.',
                'sales_rep' => 'J. Smith',
                'status' => 'Pending',
                'total_amount' => 14500.00,
                'items' => [
                    ['productId' => 1, 'quantity' => 10, 'price' => 1200.00],
                    ['productId' => 2, 'quantity' => 5, 'price' => 450.00]
                ]
            ],
            [
                'id' => 'ORD-891-B2',
                'date_raised' => 'Oct 24, 2023',
                'customer_name' => 'Globex Inc.',
                'sales_rep' => 'A. Perez',
                'status' => 'Validated',
                'total_amount' => 3250.75,
                'items' => [
                    ['productId' => 2, 'quantity' => 5, 'price' => 450.00],
                    ['productId' => 5, 'quantity' => 1, 'price' => 1800.00]
                ]
            ],
            [
                'id' => 'ORD-890-C3',
                'date_raised' => 'Oct 23, 2023',
                'customer_name' => 'Initech Solutions',
                'sales_rep' => 'M. Doe',
                'status' => 'Validated',
                'total_amount' => 890.00,
                'items' => [
                    ['productId' => 2, 'quantity' => 2, 'price' => 450.00]
                ]
            ],
            [
                'id' => 'ORD-889-D4',
                'date_raised' => 'Oct 23, 2023',
                'customer_name' => 'Soylent Corp',
                'sales_rep' => 'J. Smith',
                'status' => 'Rejected',
                'total_amount' => 12000.00,
                'items' => [
                    ['productId' => 1, 'quantity' => 10, 'price' => 1200.00]
                ]
            ],
            [
                'id' => 'ORD-888-E5',
                'date_raised' => 'Oct 22, 2023',
                'customer_name' => 'Massive Dynamic',
                'sales_rep' => 'L. Chen',
                'status' => 'Pending',
                'total_amount' => 45200.50,
                'items' => [
                    ['productId' => 4, 'quantity' => 8, 'price' => 5200.00]
                ]
            ],
            [
                'id' => 'ORD-887-F6',
                'date_raised' => 'Oct 22, 2023',
                'customer_name' => 'Umbrella Corp',
                'sales_rep' => 'A. Perez',
                'status' => 'Validated',
                'total_amount' => 1150.00,
                'items' => [
                    ['productId' => 6, 'quantity' => 1, 'price' => 2500.00]
                ]
            ],
        ];
    }

    private function getOrders()
    {
        if (!session()->has('orders')) {
            session()->put('orders', $this->getInitialOrders());
        }
        return session()->get('orders');
    }

    private function getMockProducts()
    {
        return [
            ['id' => 1, 'name' => 'Enterprise Cloud Suite', 'category' => 'Software', 'price' => 1200.00, 'stock' => 150],
            ['id' => 2, 'name' => 'SaaS API License', 'category' => 'Software', 'price' => 450.00, 'stock' => 800],
            ['id' => 3, 'name' => 'Database Storage Node', 'category' => 'Hardware', 'price' => 3500.00, 'stock' => 12],
            ['id' => 4, 'name' => 'High-Speed Rack Server', 'category' => 'Hardware', 'price' => 5200.00, 'stock' => 5],
            ['id' => 5, 'name' => 'Developer Workstation', 'category' => 'Hardware', 'price' => 1800.00, 'stock' => 25],
            ['id' => 6, 'name' => 'Premier Support (Annual)', 'category' => 'Service', 'price' => 2500.00, 'stock' => 999],
        ];
    }

    private function getMockCustomers()
    {
        return [
            ['id' => 1, 'name' => 'Acme Corporation Ltd.', 'email' => 'billing@acme.com', 'orders_count' => 12, 'total_spent' => 84200.00],
            ['id' => 2, 'name' => 'Globex Inc.', 'email' => 'procurement@globex.com', 'orders_count' => 5, 'total_spent' => 24500.50],
            ['id' => 3, 'name' => 'Initech Solutions', 'email' => 'contact@initech.com', 'orders_count' => 3, 'total_spent' => 4890.00],
            ['id' => 4, 'name' => 'Soylent Corp', 'email' => 'sales@soylent.com', 'orders_count' => 8, 'total_spent' => 37000.00],
            ['id' => 5, 'name' => 'Massive Dynamic', 'email' => 'info@massivedynamic.com', 'orders_count' => 18, 'total_spent' => 152000.00],
            ['id' => 6, 'name' => 'Umbrella Corp', 'email' => 'orders@umbrellacorp.com', 'orders_count' => 4, 'total_spent' => 9850.00],
        ];
    }

    public function dashboard()
    {
        $orders = $this->getOrders();
        
        $totalSales = array_sum(array_column($orders, 'total_amount'));
        $totalOrdersCount = count($orders);
        $pendingCount = count(array_filter($orders, fn($o) => $o['status'] === 'Pending'));
        $validatedCount = count(array_filter($orders, fn($o) => $o['status'] === 'Validated'));

        return Inertia::render('dashboard', [
            'metrics' => [
                'total_sales' => $totalSales,
                'total_orders' => $totalOrdersCount + 1234, // base count offset for aesthetic high number
                'pending_orders' => $pendingCount,
                'validated_orders' => $validatedCount,
            ],
            'chart_data' => [
                ['month' => 'Jan', 'sales' => 4000],
                ['month' => 'Feb', 'sales' => 3000],
                ['month' => 'Mar', 'sales' => 2000],
                ['month' => 'Apr', 'sales' => 2780],
                ['month' => 'May', 'sales' => 1890],
                ['month' => 'Jun', 'sales' => 2390],
                ['month' => 'Jul', 'sales' => 3490],
                ['month' => 'Aug', 'sales' => 4200],
                ['month' => 'Sep', 'sales' => 4900],
                ['month' => 'Oct', 'sales' => $totalSales > 0 ? $totalSales : 6500],
            ],
            'recent_orders' => array_slice($orders, 0, 5),
        ]);
    }

    public function orders(Request $request)
    {
        return Inertia::render('orders/index', [
            'orders' => $this->getOrders(),
        ]);
    }

    public function createOrder()
    {
        return Inertia::render('orders/create', [
            'customers' => $this->getMockCustomers(),
            'products' => $this->getMockProducts(),
        ]);
    }

    public function storeOrder(Request $request)
    {
        $request->validate([
            'customerId' => 'required',
            'salesRep' => 'required',
            'items' => 'required|array|min:1',
        ]);

        $orders = $this->getOrders();
        $customer = collect($this->getMockCustomers())->firstWhere('id', $request->customerId);

        // Calculate total amount
        $subtotal = 0;
        foreach ($request->items as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }
        $totalAmount = $subtotal * 1.11; // 11% Tax included

        $newOrder = [
            'id' => 'ORD-' . rand(100, 999) . '-' . chr(rand(65, 90)) . rand(1, 9),
            'date_raised' => now()->format('M d, Y'),
            'customer_name' => $customer['name'] ?? 'Unknown Customer',
            'sales_rep' => $request->salesRep,
            'status' => 'Pending',
            'total_amount' => round($totalAmount, 2),
            'items' => $request->items,
        ];

        array_unshift($orders, $newOrder);
        session()->put('orders', $orders);

        return redirect()->route('orders.index')->with('success', 'Order created successfully.');
    }

    public function editOrder($id)
    {
        $orders = $this->getOrders();
        $order = collect($orders)->firstWhere('id', $id);

        if (!$order) {
            abort(404, 'Order not found');
        }

        // Map items with customer information
        $customer = collect($this->getMockCustomers())->firstWhere('name', $order['customer_name']);

        return Inertia::render('orders/edit', [
            'order' => array_merge($order, [
                'customerId' => $customer['id'] ?? 1
            ]),
            'customers' => $this->getMockCustomers(),
            'products' => $this->getMockProducts(),
        ]);
    }

    public function updateOrder(Request $request, $id)
    {
        $request->validate([
            'customerId' => 'required',
            'salesRep' => 'required',
            'items' => 'required|array|min:1',
        ]);

        $orders = $this->getOrders();
        $orderIndex = collect($orders)->search(fn($o) => $o['id'] === $id);

        if ($orderIndex === false) {
            abort(404, 'Order not found');
        }

        $customer = collect($this->getMockCustomers())->firstWhere('id', $request->customerId);

        // Calculate total amount
        $subtotal = 0;
        foreach ($request->items as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }
        $totalAmount = $subtotal * 1.11;

        $orders[$orderIndex]['customer_name'] = $customer['name'] ?? 'Unknown Customer';
        $orders[$orderIndex]['sales_rep'] = $request->salesRep;
        $orders[$orderIndex]['total_amount'] = round($totalAmount, 2);
        $orders[$orderIndex]['items'] = $request->items;

        session()->put('orders', $orders);

        return redirect()->route('orders.index')->with('success', 'Order updated successfully.');
    }

    public function destroyOrder($id)
    {
        $orders = $this->getOrders();
        $filtered = array_values(array_filter($orders, fn($o) => $o['id'] !== $id));
        session()->put('orders', $filtered);

        return redirect()->route('orders.index')->with('success', 'Order deleted successfully.');
    }

    public function pipeline()
    {
        return Inertia::render('pipeline', [
            'pipeline' => [
                'prospect' => [
                    ['id' => 'deal-1', 'title' => 'Cloud Migration Service', 'company' => 'Hooli Inc.', 'value' => 25000, 'rep' => 'J. Smith'],
                    ['id' => 'deal-2', 'title' => 'Security Audit License', 'company' => 'Initech', 'value' => 8500, 'rep' => 'M. Doe'],
                ],
                'proposal' => [
                    ['id' => 'deal-3', 'title' => 'API Integration Phase 2', 'company' => 'Globex Inc.', 'value' => 12000, 'rep' => 'A. Perez'],
                ],
                'negotiation' => [
                    ['id' => 'deal-4', 'title' => 'Datacenter Server Rack', 'company' => 'Massive Dynamic', 'value' => 45000, 'rep' => 'L. Chen'],
                ],
                'closed_won' => [
                    ['id' => 'deal-5', 'title' => 'Enterprise SLA Upgrade', 'company' => 'Acme Corp', 'value' => 15000, 'rep' => 'J. Smith'],
                ],
            ]
        ]);
    }

    public function inventory()
    {
        return Inertia::render('inventory', [
            'products' => $this->getMockProducts(),
        ]);
    }

    public function customers()
    {
        return Inertia::render('customers', [
            'customers' => $this->getMockCustomers(),
        ]);
    }

    public function analytics()
    {
        return Inertia::render('analytics', [
            'rep_performance' => [
                ['name' => 'J. Smith', 'sales' => 38000, 'deals' => 15],
                ['name' => 'A. Perez', 'sales' => 24500, 'deals' => 10],
                ['name' => 'L. Chen', 'sales' => 48200, 'deals' => 8],
                ['name' => 'M. Doe', 'sales' => 12500, 'deals' => 5],
            ],
            'product_popularity' => [
                ['name' => 'Enterprise Cloud Suite', 'quantity' => 120, 'revenue' => 144000],
                ['name' => 'SaaS API License', 'quantity' => 450, 'revenue' => 202500],
                ['name' => 'Database Storage Node', 'quantity' => 18, 'revenue' => 63000],
            ]
        ]);
    }
}
