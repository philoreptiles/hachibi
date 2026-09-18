/**
 * src/components/ui/featured/featured.js
 * ---------------------------------------------------------------------
 * Tarjeta grande de "ejemplar destacado" arriba de los filtros.
 *
 * DISEÑO: Hero Banner -- la imagen ocupa todo el fondo con un degradado
 * oscuro encima para legibilidad del texto. El CTA de WhatsApp vive
 * dentro del propio banner, junto al precio.
 *
 * SELECCIÓN: automática -- el ejemplar visible MÁS CARO. Se hace una
 * consulta directa a Supabase con orden por precio descendente para
 * no depender del ordenamiento por defecto de getEjemplares().
 */
import { supabase } from '../../../supabase-config.js';
import { siteConfig } from '../../../site-config.js';
import { escapeHTML, safeImageUrl } from '../../../utils/security.js';
import { iconMarkup } from '../../../utils/icons.js';
import { openModal, getWhatsAppDetails } from '../modal/modal.js';

export async function renderFeatured(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let destacado;
    try {
        // Mismas 2 reglas que getEjemplares()/getEjemplarPorId() en
        // supabase-config.js -- sin ellas, el destacado podía salir
        // "Vendido"/"Holdback" (visible_publico = false) o, si este
        // proyecto de Supabase se comparte entre criadores, hasta el
        // ejemplar más caro de OTRO criador. Se ordena por precio
        // descendente y se toma el primero que sí es público y de
        // este sitio.
        const { data, error } = await supabase
            .from('ejemplares')
            .select('*')
            .eq('visible_publico', true)
            .eq('criador_id', siteConfig.criadorId)
            .order('precio', { ascending: false })
            .limit(1);

        if (error) throw error;
        destacado = data?.[0];
    } catch (error) {
        console.error('Error al cargar el ejemplar destacado:', error);
        return;
    }

    // Sitio nuevo sin inventario todavía: no hay nada que destacar.
    if (!destacado) {
        container.innerHTML = '';
        return;
    }

    const precioFormat = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(destacado.precio || 0);

    const especie = escapeHTML(destacado.especie || 'Reptil');
    const genetica = escapeHTML(destacado.genetica || 'Nominal');
    const sexo = escapeHTML(destacado.sexo || 'Sin sexar');
    const anio = destacado.nacimiento ? String(destacado.nacimiento).substring(0, 4) : 'N/A';
    const estatus = escapeHTML((destacado.estatus || 'Disponible').trim());
    const imagenUrl = safeImageUrl(destacado.imagen_url);

    // Clase de estatus (usa las variables CSS .status-disponible, etc.)
    const estatusNormalizado = (destacado.estatus || 'Disponible').trim().toLowerCase();
    const statusClass = `status-${estatusNormalizado.replace(/\s+/g, '-')}`;

    const { url: whatsappUrl, btnText: whatsappTexto } = getWhatsAppDetails(destacado);

    container.innerHTML = `
        <section class="featured-section">
            <div class="featured-hero" id="featured-card" role="button" tabindex="0">
                <img src="${imagenUrl}" alt="${especie}" class="featured-hero-bg" loading="lazy" />
                <div class="featured-hero-overlay"></div>

                <span class="featured-hero-badge">
                    ${iconMarkup('sparkles')} Ejemplar destacado
                </span>
                <span class="featured-hero-status ${statusClass}">${estatus}</span>

                <div class="featured-hero-content">
                    <span class="featured-hero-species">${especie}</span>
                    <h2 class="featured-hero-genetics">${genetica}</h2>
                    <p class="featured-hero-details">${sexo} • ${escapeHTML(anio)}</p>

                    <div class="featured-hero-footer">
                        <span class="featured-hero-price">${precioFormat}</span>
                        <a
                            href="${whatsappUrl}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="featured-hero-btn"
                            id="featured-whatsapp-link"
                        >
                            ${iconMarkup('whatsapp')} ${whatsappTexto}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    `;

    const abrirDetalle = () => openModal(destacado);

    const card = container.querySelector('#featured-card');
    card?.addEventListener('click', (event) => {
        if (event.target.closest('#featured-whatsapp-link')) return;
        abrirDetalle();
    });
    card?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            abrirDetalle();
        }
    });
}